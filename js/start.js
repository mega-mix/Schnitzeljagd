import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGIN ABWARTEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
let authInitialisiert = false;

fb.onAuthChanged(async (user) => {
    if (authInitialisiert && !user) {
        // Bei zweitem Aufruf und ohne user, zurück zur Login Seite
        window.location.href = "index.html";
        return;
    }
    
    // Ersten Aufruf speichern
    authInitialisiert = true;

    if (user) {
        // Spieler UID speichern
        spielerUid = user.uid;

        try {
            // Spielerinfo von Datenbank laden
            spielerInfo = await fb.getSpielerInfo(spielerUid);

            if (spielerInfo) {
                // Spielstatus von Datenbank laden
                spielStatus = await fb.getSpielStatus();

                // GUI Begrüßung schreiben
                document.getElementById("start-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;

                // Admin Nachricht visualisieren
                document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
                if (spielStatus.adminNachricht !== "") {
                    document.getElementById("admin-nachricht-display").style.display = "block";
                } else {
                    document.getElementById("admin-nachricht-display").style.display = "none";
                }

                // News Nachricht visualisieren
                document.getElementById("news-nachricht").innerText = spielStatus.news;
                if (spielStatus.news !== "") {
                    document.getElementById("news-nachricht-display").style.display = "block";
                } else {
                    document.getElementById("news-nachricht-display").style.display = "none";
                }

                // Admin Knopf anzeigen
                if (spielerInfo.spielerName === "admin") {
                    document.getElementById("start-admin-btn").style.display = "block";
                }

                // Dropdown Episoden füllen
                const dropdownEpisoden = document.getElementById("start-episoden");
                const neueEpisodeBtn = document.getElementById("start-neue-episode-btn");
                neueEpisodeBtn.style.display = "none";
                dropdownEpisoden.innerHTML = "";
                Object.entries(spielStatus.episodenKatalog).forEach(([key]) => {
                    // Freigabe Check
                    if (!spielStatus.episodenKatalog[key].globalAktiv) return;
                    if (spielerInfo.episoden[key] === undefined) {
                        // Neue Episode Knopf anzeigen
                        neueEpisodeBtn.style.display = "block";
                        return;
                    }
                    if (!spielerInfo.episoden[key].aktiv) return;

                    const opt = document.createElement("option");
                    opt.value = key; 
                    opt.textContent = "Episode " + key;
                    dropdownEpisoden.appendChild(opt);
                });
                dropdownEpisoden.value = spielerInfo.aktiveEpisode;

                // Bereich einblenden
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
document.getElementById("start-spiel-btn").addEventListener("click", () => {
    // Weiterleiten auf Spiel Seite
    window.location.href = "game.html";
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- NEUE EPISODE BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-neue-episode-btn").addEventListener("click", () => {
    // Dropdown Episoden füllen
    const dropdownEpisoden = document.getElementById("neue-episoden-laden");
    dropdownEpisoden.innerHTML = "";
    Object.entries(spielStatus.episodenKatalog).forEach(([key]) => {
        // Freigabe Check
        if (!spielStatus.episodenKatalog[key].globalAktiv) return;
        if (spielerInfo.episoden[key] === undefined) {
            const opt = document.createElement("option");
            opt.value = key; 
            opt.textContent = "Episode " + key;
            dropdownEpisoden.appendChild(opt);
        }
    });
    dropdownEpisoden.value = "";

    // Bereiche umschalten
    document.getElementById("start-bereich").style.display = "none";
    document.getElementById("neue-episode-bereich").style.display = "block";
});

document.getElementById("neue-episode-laden-btn").addEventListener("click", async () => {
    // Episode zur Datenbank hinzufügen
    try {
        const neueEpisodeKey = document.getElementById("neue-episoden-laden").value;

        // Neues Episoden Objekt lokal erstellen
        spielerInfo.episoden[neueEpisodeKey] = { aktiv: true, station: 1, antworten: [], tipps: [], zeitstempel: Date.now() };

        // Episoden Objekt in Datenbank schreiben
        await fb.updateDocument("spieler", spielerUid, {
            episoden: spielerInfo.episoden
        });

        // Dropdown Episoden neu füllen
        const dropdownEpisoden = document.getElementById("start-episoden");
        const neueEpisodeBtn = document.getElementById("start-neue-episode-btn");
        neueEpisodeBtn.style.display = "none";
        dropdownEpisoden.innerHTML = "";
        Object.entries(spielStatus.episodenKatalog).forEach(([key]) => {
            if (!spielStatus.episodenKatalog[key].globalAktiv) return;
            if (spielerInfo.episoden[key] === undefined) {
                // Neue Episode Knopf anzeigen
                neueEpisodeBtn.style.display = "block";
                return;
            }
            if (!spielerInfo.episoden[key].aktiv) return;

            const opt = document.createElement("option");
            opt.value = key; 
            opt.textContent = "Episode " + key;
            dropdownEpisoden.appendChild(opt);
        });

        // Bereiche umschalten
        document.getElementById("neue-episode-bereich").style.display = "none";
        document.getElementById("start-bereich").style.display = "block";
    } catch (error) {
        console.log("Es ist ein Fehler beim hinzufügen der Episode aufgetreten:", error);
    }
});

document.getElementById("neue-episode-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("neue-episode-bereich").style.display = "none";
    document.getElementById("start-bereich").style.display = "block";
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-admin-btn").addEventListener("click", () => {
    // Weiterleiten auf Admin Seite
    window.location.href = "admin.html";
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- EPISODEN DROPDOWN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-episoden").addEventListener("change", async (event) => {
    const auswahlEpisode = parseFloat(event.target.value);

    // Episode in Spieler Info aktualisieren
    spielerInfo.aktiveEpisode = auswahlEpisode;

    try {
        // Neue Episode in Datenbank schreiben
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
        // Abmelden von Datenbank
        await fb.auth.signOut();

        // Weiterleiten zur Login Seite
        window.location.href = "index.html";
    } catch (error) {
        console.error("Fehler beim Logout:", error);
    }
});