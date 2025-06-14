// import * as blazeface from '@tensorflow-models/blazeface'
// import * as tf from '@tensorflow/tfjs'
// import '@tensorflow/tfjs-backend-webgl'

class Course {
    constructor(id, montant) {
        this.id = id
        this.heure_depart = new Date().toLocaleString("fr-FR", { timeZone: "UTC" });
        this.heure_arrivee = null;
        this.montant = montant
    }

    terminer() {
        this.heure_arrivee = new Date().toLocaleString("fr-FR", { timeZone: "UTC" });
        this.duree = this.calcul_duree(this.heure_arrivee, this.heure_depart)
    }

    calcul_duree(date1, date2) {
        const diffMs = Math.abs(date2 - date1);
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHeures = Math.floor(diffMin / 60);
        const diffJours = Math.floor(diffHeures / 24);

        return `${diffJours} j, ${diffHeures} h, ${diffMin} m, ${diffSec} s`
    }
}

class Course_manager {
    constructor() {
        this.courses = []
        this.course_en_cours = null;
    }

    creer_course(id, montant) {
        this.course_en_cours = new Course(id, montant);
    }

    calculer_total() {
        return this.courses.reduce((acc, curr) => acc + curr.montant, 0)
    }

}

class Recorder {
    constructor() {
        this.model = null
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.captureSilentPhoto = this.captureSilentPhoto.bind(this);
        this.stream = null;
    }

    police() {
        setInterval(this.captureSilentPhoto, 2000)
    }

    screenshot() {
        console.log("photo prise")
    }

    stop() {
        // 6. Libérer les ressources
        this.stream.getTracks().forEach(track => track.stop());
    }
    async start() {
        await tf.setBackend('webgl');
        await tf.ready();

        // ✅ Démarrer la caméra
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.video.srcObject = this.stream;

        // ✅ Charger le modèle BlazeFace
        this.model = await blazeface.load();
    }
    async captureSilentPhoto() {


        // 1. Accès caméra
        this.video.srcObject = this.stream || await navigator.mediaDevices.getUserMedia({ video: true });

        // 2. Attente chargement
        await new Promise(resolve => {
            this.video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // 3. Stabilisation (optionnel)
        await new Promise(r => setTimeout(r, 1000));

        // 4. Capturer image
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const imageBase64 = this.canvas.toDataURL('image/jpeg');



        // 5. Utiliser l’image capturée
        // console.log("📷 Photo capturée :", imageBase64);
        const predictions = await this.model.estimateFaces(this.video, false);
        const persons = predictions.length;
        console.log("personnes detectées: ", predictions.length)


        // Sauvegarde dans localStorage
        const timestamp = new Date().toLocaleString("fr-FR", { timeZone: "UTC" });
        const data = {
            photo: imageBase64,
            persons,
            timestamp
        };
        localStorage.setItem(`photo_${timestamp}`, JSON.stringify(data));

        this.displayPhotos("photo-gallery")
        console.log(`📥 Photo enregistrée (${persons} personne(s))`);
    }

    displayPhotos(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Nettoyer avant affichage

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('photo_')) {
                const data = JSON.parse(localStorage.getItem(key));

                const card = document.createElement('div');
                card.style = 'border:1px solid #ccc;padding:10px;margin:10px;width:200px;text-align:center';

                const img = document.createElement('img');
                img.src = data.photo;
                img.style = 'width:100%';

                const info = document.createElement('p');
                info.textContent = `${data.persons} personne(s) détectée(s)`;

                card.appendChild(img);
                card.appendChild(info);
                container.appendChild(card);
            }
        }
    }
}

class IntervalController {
    constructor(callback, delay) {
        this.callback = callback; // Fonction à exécuter
        this.delay = delay;       // Délai en ms
        this.intervalId = null;
    }

    start() {
        if (this.isRunning()) {
            console.warn("⛔ Interval already running");
            return;
        }
        this.intervalId = setInterval(this.callback, this.delay);
        console.log("✅ Interval started");
    }

    stop() {
        if (this.isRunning()) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log("🛑 Interval stopped");
        }
    }

    isRunning() {
        return this.intervalId !== null;
    }
}


window.addEventListener("load", e => {
    const cm = new Course_manager();
    const recorder = new Recorder();
    recorder.start()
    const controller = new IntervalController(recorder.captureSilentPhoto, 2000)
    // controller.start()
    const btn_analyser = document.getElementById("analyser")
    const btn_start_course = document.getElementById("start-course")
    const btn_stop_course = document.getElementById("stop-course")
    const btn_start_day = document.getElementById("start-day")
    const btn_stop_day = document.getElementById("stop-day")

    const montant = document.getElementById("montant");
    btn_start_course.addEventListener("click", e => {
        if (montant.value === 0 || montant.value === "") {
            alert("Merci de saisir le montant avant de lancer une course")
            return;
        }
        if (cm.course_en_cours !== null) {
            alert("course dejà en cours.")
            return;
        }
        cm.creer_course(cm.courses.length + 1, parseInt(montant.value));
        console.log("course demarré");
        controller.stop();
        e.preventDefault();
    })
    btn_stop_course.addEventListener("click", e => {
        if (cm.course_en_cours === null) {
            alert("Aucune course en cours");
            return;
        }
        //termine la course et l'enregistre
        cm.course_en_cours.terminer()
        cm.courses.push(cm.course_en_cours);
        cm.course_en_cours = null;
        console.log("courses: ", cm.courses)
        console.log("total: ", cm.calculer_total())

        //start controller
        controller.start()
        e.preventDefault();
    })
    btn_start_day.addEventListener("click", e => {
        document.getElementById("tab").style.display = "block"
        btn_stop_day.style.display = "block"
        btn_start_day.style.display = "none"
        e.preventDefault()
    })
    btn_stop_day.addEventListener("click", e => {
        document.getElementById("tab").style.display = "none"
        btn_start_day.style.display = "block"
        btn_stop_day.style.display = "none"
        e.preventDefault()
    })

})