const rawData = [
    {
        "heure_debut": "18/06/2025 07:44:35",
        "arrets": [
            {
                "heure_debut": "18/06/2025 05:44:37",
                "heure_fin": "18/06/2025 07:44:41"
            },
            {
                "heure_debut": "18/06/2025 05:44:54",
                "heure_fin": "18/06/2025 05:44:59"
            }
        ],
        "heure_fin": "18/06/2025 19:45:03",
        "arret_en_cours": null,
        "status": "ENDED"
    }
    // ... autres journées
];


function parseDate(str) {
    const [d, m, y] = str.split(' ')[0].split('/');
    const [h, min, s] = str.split(' ')[1].split(':');
    return new Date(y, m - 1, d, h, min, s);
}

function toHours(ms) {
    return ms / 1000 / 60 / 60;
}

function computePerformance(total, pauses) {
    const ecartJournee = Math.abs(total - dureeCible);
    const ecartPause = Math.max(0, pauses - pauseMax);
    const scoreJournee = Math.max(0, 100 - (ecartJournee / maxEcartJourneeTolere) * 50);
    const scorePause = Math.max(0, 100 - (ecartPause / maxPauseToleree) * 50);
    return Math.round((scoreJournee + scorePause) / 2);
}

// ✅ LOGIQUE COULEUR : du BLEU (score élevé) au ROUGE (score faible)
function getColorFromScore(score, opacity = 1) {
    const ratio = 1 - score / 100; // 0 (score élevé) -> 1 (score faible)
    const r = Math.floor(33 + ratio * (244 - 33));
    const g = Math.floor(150 - ratio * 100);
    const b = Math.floor(243 - ratio * 200);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`; // RGBA : on peut moduler l’opacité
}

const dureeCible = 12; // heures
const pauseMax = 1; // heures
const maxEcartJourneeTolere = 2;
const maxPauseToleree = 2;

const labels = [];
const activeDurations = [];
const pauseDurations = [];
const activeColors = [];
const pauseColors = [];
const performances = [];

rawData.forEach((day, i) => {
    const start = parseDate(day.heure_debut);
    const end = parseDate(day.heure_fin);
    const total = toHours(end - start);

    const pauses = day.arrets.reduce((sum, arret) => {
        const ps = parseDate(arret.heure_debut);
        const pe = parseDate(arret.heure_fin);
        return sum + toHours(pe - ps);
    }, 0);

    const active = total - pauses;
    const perf = computePerformance(total, pauses);

    labels.push(`Jour ${i + 1}`);
    activeDurations.push(active);
    pauseDurations.push(pauses);

    // Couleur forte pour activité, atténuée pour pause
    activeColors.push(getColorFromScore(perf, 1));     // opaque
    pauseColors.push(getColorFromScore(perf, 0.3));    // semi-transparent
    performances.push(perf);
});

// Ensuite tu utilises ce tableau dans le Chart.js exactement comme dans le script précédent


const ctx = document.getElementById('journeesChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [
            {
                label: 'Temps actif (h)',
                data: activeDurations,
                backgroundColor: activeColors,
                stack: 'stack1'
            },
            {
                label: 'Temps de pause (h)',
                data: pauseDurations,
                backgroundColor: pauseColors,
                stack: 'stack1'
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Durée des journées avec pauses et performance thermique'
            },
            tooltip: {
                callbacks: {
                    afterBody: context => {
                        const index = context[0].dataIndex;
                        return `Score de performance : ${performances[index]}%`;
                    }
                }
            },
            legend: {
                labels: {
                    color: '#333'
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Jour'
                }
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Durée (heures)'
                },
                beginAtZero: true
            }
        }
    }
});