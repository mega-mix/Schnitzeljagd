import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleFragen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";


// ---------------------------------------------
// --- LOGIN ABWARTEN ---
// ---------------------------------------------
let authInitialisiert = false;

fb.onAuthChanged(async (user) => {
    if (authInitialisiert && !user) {
        window.location.href = "index.html";
        return;
    }
    
    authInitialisiert = true;

    if (user) {
        spielerUid = user.uid;

        try {
            spielerInfo = await fb.getDocument("spieler", spielerUid);
            if (spielerInfo) {
                spielStatus = await fb.getDocument("spielStatus", "global");

                document.getElementById("start-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;

                document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
                if (spielStatus.adminNachricht !== "") {
                    document.getElementById("admin-nachricht-display").style.display = "block";
                } else {
                    document.getElementById("admin-nachricht-display").style.display = "none";
                }

                if (spielerInfo.spielerName === "admin") {
                    document.getElementById("start-admin-btn").style.display = "block";
                }

                document.getElementById("start-bereich").style.display = "block";
            }
        } catch (error) {
            console.error("Fehler bei der Auth-Initialisierung:", error);
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

// ---------------------------------------------
// --- LOGOUT BUTTON ---
// ---------------------------------------------
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        await fb.auth.signOut();
        window.location.href = "index.html";
    } catch (error) {
        console.error("Fehler beim Logout:", error);
    }
});