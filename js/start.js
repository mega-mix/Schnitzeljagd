import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleFragen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGIN ABWARTEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
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
            spielerInfo = await fb.getSpielerInfo(spielerUid);
            if (spielerInfo) {
                spielStatus = await fb.getSpielStatus();

                document.getElementById("start-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;

                document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
                if (spielStatus.adminNachricht !== "") {
                    document.getElementById("admin-nachricht-display").style.display = "block";
                } else {
                    document.getElementById("admin-nachricht-display").style.display = "none";
                }

                document.getElementById("news-nachricht").innerText = spielStatus.news;
                if (spielStatus.news !== "") {
                    document.getElementById("news-nachricht-display").style.display = "block";
                } else {
                    document.getElementById("news-nachricht-display").style.display = "none";
                }

                if (spielerInfo.spielerName === "admin") {
                    document.getElementById("start-admin-btn").style.display = "block";
                }

                const dropdownEpisoden = document.getElementById("start-episoden");
                dropdownEpisoden.innerHTML = "";
                Object.entries(spielerInfo.episoden).forEach(([key]) => {
                    if (!spielerInfo.episoden[key].aktiv) return;
                    const opt = document.createElement("option");
                    opt.value = key; 
                    opt.textContent = "Episode " + key;
                    dropdownEpisoden.appendChild(opt);
                });
                dropdownEpisoden.value = spielerInfo.aktiveEpisode;

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





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- SPIEL BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-spiel-btn").addEventListener("click", () => window.location.href = "game.html");





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-admin-btn").addEventListener("click", () => window.location.href = "admin.html");





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- EPISODEN DROPDOWN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-episoden").addEventListener("change", async (event) => {
    const auswahlEpisode = parseFloat(event.target.value);

    spielerInfo.aktiveEpisode = auswahlEpisode;

    try {
        await fb.updateDocument("spieler", spielerUid, {
            aktiveEpisode: spielerInfo.aktiveEpisode
        });
    } catch (error) {
        console.error(error);
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGOUT BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        await fb.auth.signOut();
        window.location.href = "index.html";
    } catch (error) {
        console.error("Fehler beim Logout:", error);
    }
});