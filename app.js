


window.addEventListener("load", e => {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem("identifiant")
        // 🧪 Simule une déconnexion
        alert("Déconnexion réussie.");
        window.location.href = "index.html"; // Redirection vers page de connexion
        e.preventDefault()
    });

    if (JSON.parse(localStorage.getItem("identifiant") === null)) {
        window.location.href = "index.html"
    }
})