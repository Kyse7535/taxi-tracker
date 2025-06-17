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
    constructor(pause_manager) {
        this.courses = JSON.parse(localStorage.getItem("courses")) || []
        this.course_en_cours = JSON.parse(localStorage.getItem("course_en_cours")) ?
            Object.assign(new Course(), JSON.parse(localStorage.getItem("course_en_cours"))) : null;
        this.montant = document.getElementById("montant");
        this.btn_start_course = document.getElementById("start-course")
        this.btn_stop_course = document.getElementById("stop-course")
        //retirer les boutons pauses
        //affiche les boutons de pause
        this.pause_manager = pause_manager;

    }

    init() {
        //SI j'ai une course en cours j'affiche le stop course button...
        if (this.course_en_cours && !this.course_en_cours.heure_arrivee) {
            this.btn_stop_course.style.display = "block"
            this.btn_start_course.style.display = "none"

            document.getElementById("stop-day").style.display = "none"
            document.getElementById("pause-day").style.display = "none"
            document.getElementById("end-pause-day").style.display = "none"

            this.montant.value = this.course_en_cours.montant
        }
    }

    start(controller) {
        let that = this
        this.btn_start_course.addEventListener("click", e => {
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

            //retirer les boutons pauses et de fin de journée pendant la course
            const btn_pause_day = document.getElementById("pause-day")
            const btn_fin_pause_day = document.getElementById("end-pause-day")
            btn_fin_pause_day.style.display = "none"
            btn_pause_day.style.display = "none"

            //affiche le btn fin de course et retire le btn start course
            that.btn_start_course.style.display = "none"
            that.btn_stop_course.style.display = "block"

            //retire le btn fin de journée
            document.getElementById("stop-day").style.display = "none"
            controller.stop();
            e.preventDefault();
        })
        this.btn_stop_course.addEventListener("click", e => {
            if (this.course_en_cours === null) {
                alert("Aucune course en cours");
                return;
            }
            //termine la course et l'enregistre
            if (that.course_en_cours !== null) {
                that.course_en_cours.terminer()
                that.montant.value = 0
            }
            that.courses.push({ ...this.course_en_cours });
            that.course_en_cours = null;
            console.log("total: ", this.calculer_total())

            that.btn_start_course.style.display = "block"
            that.btn_stop_course.style.display = "none"

            //affiche les boutons de pause
            const btn_pause_day = document.getElementById("pause-day")
            const btn_fin_pause_day = document.getElementById("end-pause-day")
            btn_pause_day.style.display = "block"

            //affiche le btn fin de journée
            document.getElementById("stop-day").style.display = "block"


            localStorage.setItem("courses", JSON.stringify(that.courses))
            localStorage.removeItem("course_en_cours")

            //start controller
            controller.start()
            e.preventDefault();
        })
    }

    creer_course(id) {
        this.course_en_cours = new Course(id, this.montant.value);
        localStorage.setItem("course_en_cours", JSON.stringify({ ...this.course_en_cours }))
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

class Arret {
    constructor() {
        this.heure_debut = new Date().toLocaleString("fr-FR", { timeZone: "UTC" });
        this.heure_fin = null
    }

    setHeureDebut(heure) {
        this.heure_debut = heure
    }

    setHeureFin(heure) {
        this.heure_fin = heure
    }
}

class Day {
    constructor() {
        this.heure_debut = null
        this.arrets = []
        this.heure_fin = null
        this.arret_en_cours = null
        this.status = "NOT_STARTED"
    }
}


class TabDisplay {
    constructor(parameters) {
        this.btn_stop_day = document.getElementById("stop-day")
        this.btn_start_day = document.getElementById("start-day")
        this.identifiant = document.getElementById("identifiant")
    }
    hide_tab() {
        localStorage.removeItem("identifiant")
        document.getElementById("tab").style.display = "block"
        this.btn_stop_day.style.display = "none"
        this.btn_start_day.style.display = "block"
        this.identifiant.style.display = "block"
    }
    display_tab() {

    }
}

class DayManager {
    constructor(controller, course_manager) {
        this.day = Object.assign(new Day(), JSON.parse(localStorage.getItem("day"))) || new Day()
        let that = this
        this.start_day = this.start_day.bind(this)
        this.controller = controller
        this.course_manager = course_manager
        this.btn_start_day = document.getElementById("start-day");
        this.btn_stop_day = document.getElementById("stop-day");
        this.btn_pause_day = document.getElementById("pause-day");
        this.btn_fin_pause_day = document.getElementById("end-pause-day");
        const identifiant = localStorage.getItem("identifiant");
        if (this.day.status === "STARTED") {
            this.display_btn()
        }
        this.btn_start_day.addEventListener("click", e => {
            this.start_day(identifiant);
            e.preventDefault();
        })
        this.btn_stop_day.addEventListener("click", e => {
            const confirm = window.confirm("Cette action est irreversible. oulez-vous continuer ?")
            if (!confirm) {
                return;
            }
            this.stop_day();
            e.preventDefault();
        })
        this.btn_pause_day.addEventListener("click", e => {
            that.day.status = "PAUSED";
            that.day.arret_en_cours = new Arret();
            localStorage.setItem("day", JSON.stringify(that.day));

            //arreter le controller
            that.controller.stop()

            that.btn_fin_pause_day.style.display = "block"
            that.btn_pause_day.style.display = "none"

            //retire la possibilité de faire une courses pendant la pause
            document.getElementById("montant").style.display = "none"
            document.getElementById("start-course").style.display = "none"

            //retire la possibilité de terminer la journée
            document.getElementById("stop-day").style.display = "none"
        })
        this.btn_fin_pause_day.addEventListener("click", e => {
            that.day.status = "STARTED"
            const arret_en_cours = { ...that.day.arret_en_cours }
            that.day.arret_en_cours = Object.assign(new Arret(), arret_en_cours)

            if (that.day.arret_en_cours instanceof Arret) {
                that.day.arret_en_cours.setHeureFin(new Date().toLocaleString("fr-FR", { timeZone: "UTC" }))
            }
            that.day.arrets.push({ ...that.day.arret_en_cours })
            that.day.arret_en_cours = null
            localStorage.setItem("day", JSON.stringify(that.day));

            that.btn_pause_day.style.display = "block"

            that.btn_fin_pause_day.style.display = "none"


            //retablis la possibilité de faire une courses pendant la pause
            document.getElementById("montant").style.display = "block"
            document.getElementById("start-course").style.display = "block"

            //retablis la possibilité de terminer la journée
            document.getElementById("stop-day").style.display = "block"

            that.controller.start()
        })
        this.detect_arret();
    }

    init() {
        if (this.day && this.day.heure_debut && !this.day.heure_fin) {
            document.getElementById("tab").style.display = "block"

            document.getElementById("identifiant").style.display = "none"
            document.getElementById("start-day").style.display = "none"
        }

        if (this.day && this.day.arret_en_cours) {
            this.btn_fin_pause_day.style.display = "block"
            this.btn_pause_day.style.display = "none"
            this.btn_stop_day.style.display = "none"

            document.getElementById("montant").style.display = "none"
            document.getElementById("start-course").style.display = "none"
            document.getElementById("stop-course").style.display = "none"
        }
    }

    display_btn() {
        document.getElementById("tab").style.display = "block"
        this.btn_stop_day.style.display = "block"
        this.btn_start_day.style.display = "none"
        document.getElementById("identifiant").style.display = "none"
        this.btn_pause_day.style.display = "block"
        document.getElementById("stop-course").style.display = "none"
    }

    hide_btn() {
        localStorage.removeItem("identifiant")
        document.getElementById("tab").style.display = "none"
        this.btn_stop_day.style.display = "none"
        this.btn_start_day.style.display = "block"
        document.getElementById("identifiant").style.display = "block"
    }

    start_day(identifiant_saved) {
        this.day.heure_debut = new Date().toLocaleString("fr-FR", { timeZone: "UTC" });
        this.day.status = "STARTED"
        localStorage.setItem("day", JSON.stringify(this.day))
        if (!identifiant_saved && identifiant.value === "") {
            alert("Merci de saisir votre identifiant")
            return;
        }
        if (!identifiant_saved) {
            localStorage.setItem("identifiant", identifiant.value)
        }
        this.display_btn()
        this.controller.start()
    }


    stop_day() {
        this.day.status = "ENDED"
        this.day.heure_fin = new Date().toLocaleString("fr-FR", { timeZone: "UTC" });
        localStorage.setItem("day", JSON.stringify(this.day))

        this.hide_btn()
        this.controller.stop()
    }

    detect_arret() {
        let that = this
        document.addEventListener("visibilitychange", (e) => {
            //Si je sors de l'app alors que je suis en pleine activité
            //J'enregistre un arret
            that.day = Object.assign(new Day(), JSON.parse(localStorage.getItem("day")))
            if (document.visibilityState === "hidden"
                && this.day.status === "STARTED" && this.course_manager && !this.course_manager.course_en_cours) {
                that.day.arret_en_cours = new Arret()
                localStorage.setItem("day", JSON.stringify({ ...that.day }))
                console.log("🕵️ L'utilisateur quitte ou minimise l'app");
            }
            if (document.visibilityState === 'visible'
                && that.day.status === "STARTED" && that.day.arret_en_cours instanceof Arret) {

                that.day.arret_en_cours.setHeureFin(new Date().toLocaleString("fr-FR", { timeZone: "UTC" }))
                that.day.arrets.push({ ...that.day.arret_en_cours })
                that.day.arret_en_cours = null;
                localStorage.setItem("day", JSON.stringify({ ...that.day }))
                console.log("👀 L'utilisateur est revenu dans l'app");
            }
        });
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

    const day_manager = new DayManager(controller, cm);
    cm.init()
    day_manager.init()
})