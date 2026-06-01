import { FirebaseService } from "./classes/FirebaseService.js";


// Instanzen der Services erstellen
const fb = new FirebaseService();

document.getElementById("version").innerText = "v 1.2.0";

let aktuelleGruppe = "";
let aktuellerFortschritt = 0;
let katalogNr = 0;
let alleFragen = [];


// ---------------------------------------------
// --- LOGIN ABWARTEN ---
// ---------------------------------------------
fb.onAuthChanged(async (user) => {
    if (user) {
        const daten = await fb.getDocument("gruppen", user.uid);
        if (daten) {
            aktuelleGruppe = daten.gruppenName;
            aktuellerFortschritt = daten.fortschritt || 0;
            katalogNr = daten.katalog;

            const freigegeben = await fb.istSpielFreigegeben();

            if (aktuelleGruppe === "admin") {
                document.getElementById("start-admin-btn").style.display = "block";
            }

            document.getElementById("start-bereich").style.display = "block";
            document.getElementById("start-begruessung").innerText = `Hallo ${aktuelleGruppe}`;

            const adminNachricht = await fb.getAdminNachricht();

            if (adminNachricht !== "") {
                document.getElementById("admin-nachricht-display").style.display = "block";
                document.getElementById("admin-nachricht-display").innerText = adminNachricht;
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