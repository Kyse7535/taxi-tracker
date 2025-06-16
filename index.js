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
        this.montant = document.getElementById("montant");
    }

    start(controller) {
        const btn_start_course = document.getElementById("start-course")
        const btn_stop_course = document.getElementById("stop-course")
        btn_start_course.addEventListener("click", e => {
            if (this.montant.value === 0 || this.montant.value === "") {
                alert("Merci de saisir le montant avant de lancer une course")
                return;
            }
            if (this.course_en_cours !== null) {
                alert("course dejà en cours.")
                return;
            }
            this.creer_course(this.courses.length + 1);
            alert("course demarré");
            controller.stop();
            e.preventDefault();
        })
        btn_stop_course.addEventListener("click", e => {
            if (this.course_en_cours === null) {
                alert("Aucune course en cours");
                return;
            }
            //termine la course et l'enregistre
            this.course_en_cours.terminer()
            this.courses.push(this.course_en_cours);
            this.course_en_cours = null;
            console.log("courses: ", this.courses)
            console.log("total: ", this.calculer_total())

            //start controller
            controller.start()
            e.preventDefault();
        })
    }

    creer_course(id) {
        this.course_en_cours = new Course(id, this.montant);
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

class DayManager {
    constructor(controller) {
        const btn_start_day = document.getElementById("start-day")
        const btn_stop_day = document.getElementById("stop-day")
        btn_start_day.addEventListener("click", e => {
            const identifiant = document.getElementById("identifiant")
            if (identifiant.value === "") {
                alert("Merci de saisir votre identifiant")
                return;
            }
            identifiant.style.display = "none";
            btn_start_day.style.display = "none"
            controller.start()
            document.getElementById("tab").style.display = "block"
            btn_stop_day.style.display = "block"
            btn_start_day.style.display = "none"
            e.preventDefault()
        })
        btn_stop_day.addEventListener("click", e => {
            document.getElementById("tab").style.display = "none"
            btn_start_day.style.display = "block"
            identifiant.style.display = "block"
            btn_stop_day.style.display = "none"
            controller.stop()
            e.preventDefault()
        })
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
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log("service worker registred", reg))
            .catch((err) => console.log("service worker not registered", err))
    }
    const cm = new Course_manager();
    const recorder = new Recorder();
    recorder.start()
    const controller = new IntervalController(recorder.captureSilentPhoto, 10000)
    cm.start(controller)
    const btn_analyser = document.getElementById("analyser")

    const day_manager = new DayManager(controller);
})