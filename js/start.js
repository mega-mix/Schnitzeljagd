import { FirebaseService } from "./classes/FirebaseService.js";


// Instanzen der Services erstellen
const fb = new FirebaseService();

document.getElementById("version").innerText = "v 1.4.0";

let alleFragen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";


// ---------------------------------------------
// --- LOGIN ABWARTEN ---
// ---------------------------------------------
fb.onAuthChanged(async (user) => {
    if (user) {
        spielerUid = user.uid;
        spielerInfo = await fb.getDocument("gruppen", spielerUid);
        if (spielerInfo) {
            spielStatus = await fb.getDocument("spielStatus", "global");

            if (spielerInfo.gruppenName === "admin") {
                document.getElementById("start-admin-btn").style.display = "block";
            }

            document.getElementById("start-bereich").style.display = "block";
            document.getElementById("start-begruessung").innerText = `Hallo ${spielerInfo.gruppenName}`;

            document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
            if (spielStatus.adminNachricht !== "") {
                document.getElementById("admin-nachricht-display").style.display = "block";
            } else {
                document.getElementById("admin-nachricht-display").style.display = "none";
            }
        }
    } else {
        // Nicht eingeloggt? Rauswurf zurück zur Loginseite!
        window.location.href = "index.html";
    }
});


// ---------------------------------------------
// --- SPIEL BUTTON ---
// ---------------------------------------------
document.getElementById("start-spiel-btn").addEventListener("click", () => window.location.href = "game.html");


// ---------------------------------------------
// --- ADMIN BUTTON ---
// ---------------------------------------------
document.getElementById("start-admin-btn").addEventListener("click", () => window.location.href = "admin.html");