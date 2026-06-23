import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";
let alleStationen = [];





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

                    const opt = document.createElement("option");
                    opt.value = key; 
                    opt.textContent = "Episode " + key + " - " + spielStatus.episodenKatalog[key].titel;
                    opt.disabled = !spielerInfo.episoden[key].aktiv;
                    if (!spielerInfo.episoden[key].aktiv) opt.textContent += " - 🔒💲";
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
// *-------------------- START BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("start-spiel-btn").addEventListener("click", () => {
    // Weiterleiten auf Spiel Seite
    window.location.href = "game.html";
});

document.getElementById("start-admin-btn").addEventListener("click", () => {
    // Weiterleiten auf Admin Seite
    window.location.href = "admin.html";
});

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

document.getElementById("start-fortschritt-btn").addEventListener("click", async () => {
    // Dropdown Episoden füllen
    const dropdownEpisoden = document.getElementById("fortschritt-episoden");
    dropdownEpisoden.innerHTML = "";
    Object.entries(spielStatus.episodenKatalog).forEach(([key]) => {
        // Freigabe Check
        if (!spielStatus.episodenKatalog[key].globalAktiv) return;
        if (spielerInfo.episoden[key] === undefined) return;

        // Daten generieren
        const opt = document.createElement("option");
        opt.value = key; 
        opt.textContent = "Episode " + key + " - " + spielStatus.episodenKatalog[key].titel;
        opt.disabled = !spielerInfo.episoden[key].aktiv;
        if (!spielerInfo.episoden[key].aktiv) opt.textContent += " - 🔒💲";
        dropdownEpisoden.appendChild(opt);
    });
    dropdownEpisoden.value = spielerInfo.aktiveEpisode;

    // Stationen von Datenbank abrufen
    try {
        const episodenPath = "episode" + dropdownEpisoden.value;
        alleStationen = await fb.getAllDocuments(episodenPath);
    } catch (error) {
        console.log("Fehler beim Laden der Stationen: ", error);
    }

    // Fortschritt anzeigen
    const anzeigeText = "Fortschritt: " + spielerInfo.episoden[dropdownEpisoden.value].station + " / " + alleStationen.length;
    document.getElementById("fortschritt-fortschritt").innerText = anzeigeText;

    // Bereiche umschalten
    document.getElementById("start-bereich").style.display = "none";
    document.getElementById("fortschritt-bereich").style.display = "block";
});

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
            opt.textContent = "Episode " + key + " - " + spielStatus.episodenKatalog[key].titel;
            if (!spielStatus.episodenKatalog[key].freeToPlay) opt.textContent += " - 🔒💲";
            dropdownEpisoden.appendChild(opt);
        }
    });
    dropdownEpisoden.selectedIndex = 0;

    // Free to play info
    const freeNachricht = document.getElementById("neue-episode-free");
    if (!spielStatus.episodenKatalog[dropdownEpisoden.value].freeToPlay) {
        freeNachricht.innerText = "🔒💲 Diese Episode ist nicht Kostenlos und muss nach dem Download vom Admin freigegeben werden.";
    } else {
        freeNachricht.innerText = "";
    }

    // Bereiche umschalten
    document.getElementById("start-bereich").style.display = "none";
    document.getElementById("neue-episode-bereich").style.display = "block";
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- FORTSCHRITT BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("fortschritt-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("fortschritt-bereich").style.display = "none";
    document.getElementById("start-bereich").style.display = "block";
});

document.getElementById("fortschritt-reset-btn").addEventListener("click", async () => {
    const keyEpisode = document.getElementById("fortschritt-episoden").value;
    const resetBtn = document.getElementById("fortschritt-reset-btn");

    // Popup zur Bestätigung
    const entscheidung = confirm(`Möchtest du deinen Fortschritt in Episode ${keyEpisode} wirklich zurücksetzen?`);
    if (!entscheidung) return;

    // Reset Knopf sperren
    resetBtn.disabled = true;
    resetBtn.innerText = "Bitte warten...";

    // Fortschritt in Spielerdaten setzen
    spielerInfo.episoden[keyEpisode].station = 1;
    spielerInfo.episoden[keyEpisode].tipps = [];
    spielerInfo.episoden[keyEpisode].zeitstempel = Date.now();

    // Fortschritt anzeigen
    const anzeigeText = "Fortschritt: " + spielerInfo.episoden[keyEpisode].station + " / " + alleStationen.length;
    document.getElementById("fortschritt-fortschritt").innerText = anzeigeText;

    // Spielerdaten in Datenbank schreiben
    try {
        await fb.updateDocument("spieler", spielerUid, {
            [`episoden.${keyEpisode}`]: spielerInfo.episoden[keyEpisode]
        });
    } catch (error) {
        console.log("Fehler beim Rücksetzen des Fortschritts: ", error);
    } finally {
        // Reset Knopf freigeben
        resetBtn.disabled = false;
        resetBtn.innerText = "Reset";
    }
});

document.getElementById("fortschritt-episoden").addEventListener("change", async (obj) => {
    // Stationen von Datenbank abrufen
    try {
        const episodenPath = "episode" + obj.target.value;
        alleStationen = await fb.getAllDocuments(episodenPath);
    } catch (error) {
        console.log("Fehler beim Laden der Stationen: ", error);
    }

    // Fortschritt anzeigen
    const anzeigeText = "Fortschritt: " + spielerInfo.episoden[obj.target.value].station + " / " + alleStationen.length;
    document.getElementById("fortschritt-fortschritt").innerText = anzeigeText;
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- NEUE EPISODE BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("neue-episode-laden-btn").addEventListener("click", async () => {
    // Episode zur Datenbank hinzufügen
    try {
        const neueEpisodeKey = document.getElementById("neue-episoden-laden").value;

        // Neues Episoden Objekt lokal erstellen
        spielerInfo.episoden[neueEpisodeKey] = { aktiv: spielStatus.episodenKatalog[neueEpisodeKey].freeToPlay, station: 1, antworten: [], tipps: [], zeitstempel: Date.now() };

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

            const opt = document.createElement("option");
            opt.value = key; 
            opt.textContent = "Episode " + key + " - " + spielStatus.episodenKatalog[key].titel;
            opt.disabled = !spielerInfo.episoden[key].aktiv;
            if (!spielerInfo.episoden[key].aktiv) opt.textContent += " - 🔒💲";
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

document.getElementById("neue-episoden-laden").addEventListener("change", () => {
    const dropdownEpisoden = document.getElementById("neue-episoden-laden");

    // Free to play info
    const freeNachricht = document.getElementById("neue-episode-free");
    if (!spielStatus.episodenKatalog[dropdownEpisoden.value].freeToPlay) {
        freeNachricht.innerText = "Diese Episode ist nicht Kostenlos und muss nach dem Download vom Admin freigegeben werden.";
    } else {
        freeNachricht.innerText = "";
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