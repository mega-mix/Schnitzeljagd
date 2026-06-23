import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleStationen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";
const anzahlAntwortenSpeicher = 50; // Grenze für gespeicherte Antworten





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
                // Stationen Laden
                await stationenLaden(spielerInfo.aktiveEpisode);

                // Station darstellen
                await zeigeStation();
            } else {
                // Weiterleiten zur Login Seite
                windows.location.href = "index.html";
            }
        } catch (error) {
            console.error("Fehler bei der Auth-Initialisierung:", error);
        }
    } else {
        // Weiterleiten zur Login Seite
        window.location.href = "index.html";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- SPIEL LOGIK --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
async function zeigeStation() {
    const spielBereich = document.getElementById("spiel-bereich");
    const container = document.getElementById("spiel-frage");
    const spielTipp = document.getElementById("spiel-tipp");
    const spielTippBtn = document.getElementById("spiel-tipp-btn");

    try {
        // Spielstatus von Datenbank laden
        spielStatus = await fb.getSpielStatus();

        // Spieler Info von Datenbank laden
        const neueSpielerInfo = await fb.getSpielerInfo(spielerUid);

        // Erfolgsprüfung
        if (!neueSpielerInfo || !spielStatus) return;

        // Falls Episode geändert wurde, Stationen aus Datenbank laden
        if (spielerInfo.aktiveEpisode !== neueSpielerInfo.aktiveEpisode) {
            await stationenLaden(neueSpielerInfo.aktiveEpisode);
        }

        // Geladene Spielerinfo in Speicher schreiben
        spielerInfo = neueSpielerInfo;

        // GUI Begrüßung anzeigen
        document.getElementById("spiel-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;

        // Admin Nachricht anzeigen
        document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
        if (spielStatus.adminNachricht !== "") {
            document.getElementById("admin-nachricht-display").style.display = "block";
        } else {
            document.getElementById("admin-nachricht-display").style.display = "none";
        }
    
        // Variablen vereinfachen
        const keyEpisode = spielerInfo.aktiveEpisode;
        const spielerEpisode = spielerInfo.episoden[keyEpisode];

        // Im Tipp Array schauen ob die Station vorhanden ist
        const indexTipp = spielerInfo.episoden[keyEpisode].tipps.findLastIndex(tp => tp.station === spielerInfo.episoden[keyEpisode].station);

        // Wenn Station in Array gefunden wurde
        if (indexTipp >= 0) {
            // Tipp wurde schon angezeigt, dann wieder zeigen
            const tippNr = spielerInfo.episoden[keyEpisode].tipps[indexTipp].tippNr;
            switch (tippNr) {
                case 1:
                    // Tipp Knopf beschriften wenn weiterer Tipp vorhanden
                    if (alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2 !== undefined && alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2 !== "") {
                        spielTippBtn.innerText = "Tipp 2 anzeigen";
                    } else {
                        spielTippBtn.innerText = "Tipp anzeigen";
                        spielTippBtn.disabled = true;
                    }

                    // Tipp anzeigen
                    spielTipp.innerHTML = `
                        Tipp 1: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp1}
                    `;
                    break;

                case 2:
                    // Tipp Knopf beschriften wenn weiterer Tipp vorhanden
                    if (alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp3 !== undefined && alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp3 !== "") {
                        spielTippBtn.innerText = "Tipp 3 anzeigen";
                    } else {
                        spielTippBtn.innerText = "Tipp anzeigen";
                        spielTippBtn.disabled = true;
                    }

                    // Tipps anzeigen
                    spielTipp.innerHTML = `
                        Tipp 1: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp1}
                        <br><hr>
                        Tipp 2: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2}
                    `;
                    break;

                case 3:
                    // Tipp Knopf sperren
                    spielTippBtn.disabled = true;
                    spielTippBtn.innerText = "Tipp anzeigen";

                    // Tipps anzeigen
                    spielTipp.innerHTML = `
                        Tipp 1: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp1}
                        <br><hr>
                        Tipp 2: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2}
                        <br><hr>
                        Tipp 3: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp3}
                    `;
                    break;
            }
        } else {
            // Tipp Knopf freigeben und Tipp leeren
            spielTippBtn.disabled = false;
            spielTippBtn.innerText = "Tipp 1 anzeigen";
            spielTipp.innerText = "";
        }

        // Auswerten ob Spiel freigegeben ist
        if (!spielStatus.freigegeben) {
            // Spiel nicht freigegeben, GUI generieren
            container.innerHTML = `
                <p>Station ${spielerEpisode.station}</p>
                <h3>Das Spiel ist aktuell pausiert.</h3>
                <p>Bitte warte auf die Freigabe.</p>
                <button id="status-btn">Aktualisieren</button>
            `;
            document.getElementById("spiel-tipp-container").style.display = "none";
        }
        else if (spielerEpisode.station < alleStationen.length) {
            // Spiel freigegeben, und fortschritt noch nicht am Ende

            // Tipp anzeigen
            if (spielStatus.tipps) {
                document.getElementById("spiel-tipp-container").style.display = "block";
            } else {
                document.getElementById("spiel-tipp-container").style.display = "none";
            }

            // GUI zur Station generieren
            container.innerHTML = `
                <p>Station ${spielerEpisode.station}</p>
                <p>${alleStationen[spielerEpisode.station-1].frage}</p>
                <textarea id="antwort-input" placeholder="Deine Antwort"></textarea>
                <button id="antwort-btn">Antwort prüfen</button>
                <p id="spiel-feedback" style="color:red;"></p>
            `;
        }
        else {
            // Spiel Ende Nachricht anzeigen
            container.innerHTML = `<h3>Glückwunsch! Die Suche wurde erfolgreich gemeistert! 🎉</h3>`;
            document.getElementById("spiel-tipp-container").style.display = "none";
        }

        // Bereich anzeigen
        spielBereich.style.display = "block";
    } catch (error) {
        console.error("Fehler beim Live-Laden der Station:", error);
    }
}

async function pruefeAntwort() {
    const antwortBtn = document.getElementById("antwort-btn");
    const spielerAntwort = document.getElementById("antwort-input").value;
    const feedback = document.getElementById("spiel-feedback");
    const bereinigteSpielerAntwort = spielerAntwort.toLowerCase().trim();
    let istRichtig = false;

    // Indexe speichern
    const keyEpisode = spielerInfo.aktiveEpisode;

    // Antwort mit Lösung vergleichen
    if (spielerInfo.episoden[keyEpisode].station <= alleStationen.length) {
        const korrekteAntwort = alleStationen[spielerInfo.episoden[keyEpisode].station-1].antwort.toLowerCase().trim();
        istRichtig = bereinigteSpielerAntwort === korrekteAntwort;
    }

    // Antwort in Array sichern
    const antwortObj = {
        station: spielerInfo.episoden[keyEpisode].station,
        antwort: bereinigteSpielerAntwort,
        zeitstempel: Date.now()
    }
    if (spielerInfo.episoden[keyEpisode].antworten.length >= anzahlAntwortenSpeicher) {
        spielerInfo.episoden[keyEpisode].antworten = spielerInfo.episoden[keyEpisode].antworten.shift();
    }
    spielerInfo.episoden[keyEpisode].antworten.push(antwortObj);
    spielerInfo.episoden[keyEpisode].zeitstempel = Date.now();

    // Auswertung
    if (istRichtig) {
        // Antwort richtig

        // Antwort Knopf deaktivieren
        if (antwortBtn) {
            antwortBtn.disabled = true;
            antwortBtn.innerText = "Bitte warten...";
        }

        // Station hochzählen
        spielerInfo.episoden[keyEpisode].station++;

        // Daten in Datenbank schreiben
        try {
            await fb.updateDocument("spieler", spielerUid, {
                [`episoden.${keyEpisode}`]: spielerInfo.episoden[keyEpisode]
            });
            await zeigeStation();
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern der Station.";

            // Antwort Knopf freigeben
            if (antwortBtn) {
                antwortBtn.disabled = false;
                antwortBtn.innerText = "Antwort senden";
            }
        }
    } else {
        // Antwort falsch

        // Falsch Meldung anzeigen
        feedback.style.color = "red";
        feedback.innerText = "Falsche Antwort! Versucht es noch einmal.";

        // Visuelles feedback GUI
        feedback.classList.remove("shake-blink");
        void feedback.offsetWidth;
        feedback.classList.add("shake-blink");
        if (antwortBtn) {
            antwortBtn.classList.remove("btn-error-flash");
            void antwortBtn.offsetWidth;
            antwortBtn.classList.add("btn-error-flash");
            antwortBtn.disabled = true;
        }

        // Daten in Datenbank schreiben
        try {
            await fb.updateDocument("spieler", spielerUid, {
                [`episoden.${keyEpisode}`]: spielerInfo.episoden[keyEpisode]
            });
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern der Station.";

        } finally {
            // Antwort Knopf freigeben
            if (antwortBtn) {
                antwortBtn.disabled = false;
                antwortBtn.innerText = "Antwort senden";
            }
        }
    }
}

async function stationenLaden(episode) {
    try {
        // Dateinamen erstellen
        const episodePath = "episode" + episode;

        // Alle Stationen aus Datenbank laden
        const geladeneStationen = await fb.getAllDocuments(episodePath);

        // Stationen in Array sortieren
        alleStationen = geladeneStationen.sort((a, b) => {
            return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
    } catch (error) {
        console.error("Fehler beim Laden der Station:", error);
    }
}





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- GLOBALER KLICK-WATCHER --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener("click", async (event) => {
    // Abfangen des dynamischen Antwort-Buttons
    if (event.target && event.target.id === "antwort-btn") {
        // Antwort prüfen
        await pruefeAntwort();
    }
    
    // Abfangen des dynamischen Pausen-Aktualisieren-Buttons
    if (event.target && event.target.id === "status-btn") {
        // Seite aktualisieren
        location.reload();
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- TIPP BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("spiel-tipp-btn").addEventListener("click", async () => {
    const spielTipp = document.getElementById("spiel-tipp");
    const tippBtn = document.getElementById("spiel-tipp-btn");

    // Abbruch bei fehlenden spielerInfo oder alleStationen
    if (!spielerInfo || alleStationen.length === 0) return; 

    // Indexe speichern
    const keyEpisode = spielerInfo.aktiveEpisode;

    // Abbruch bei fehlerhaften Werten
    if (spielerInfo.episoden[keyEpisode].station === undefined || spielerInfo.episoden[keyEpisode].station > alleStationen.length) return;

    // Tipp Knopf sperren
    if (tippBtn) tippBtn.disabled = true;

    // Im Tipp Array schauen ob die Station vorhanden ist
    const indexTipp = spielerInfo.episoden[keyEpisode].tipps.findLastIndex(tp => tp.station === spielerInfo.episoden[keyEpisode].station);

    // Wenn nicht im Array, Tipp ist erster Tipp
    let tippNr = 1;
    if (indexTipp >= 0) tippNr = spielerInfo.episoden[keyEpisode].tipps[indexTipp].tippNr +1;

    // Auswerten welcher Tipp angezeigt wird
    switch (tippNr) {
        case 1:
            // Tipp Knopf beschriften wenn weiterer Tipp vorhanden
            if (alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2 !== undefined && alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2 !== "") {
                tippBtn.innerText = "Tipp 2 anzeigen";
            } else {
                tippBtn.innerText = "Tipp anzeigen";
                tippBtn.disabled = true;
            }

            // Tipp anzeigen
            spielTipp.innerHTML = `
                Tipp 1: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp1}
            `;
            break;

        case 2:
            // Tipp Knopf beschriften wenn weiterer Tipp vorhanden
            if (alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp3 !== undefined && alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp3 !== "") {
                tippBtn.innerText = "Tipp 3 anzeigen";
            } else {
                tippBtn.innerText = "Tipp anzeigen";
                tippBtn.disabled = true;
            }

            // Tipps anzeigen
            spielTipp.innerHTML = `
                Tipp 1: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp1}
                <br><hr>
                Tipp 2: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2}
            `;
            break;

        case 3:
            // Tipp Knopf sperren
            tippBtn.disabled = true;
            tippBtn.innerText = "Tipp anzeigen";

            // Tipps anzeigen
            spielTipp.innerHTML = `
                Tipp 1: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp1}
                <br><hr>
                Tipp 2: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp2}
                <br><hr>
                Tipp 3: ${alleStationen[spielerInfo.episoden[keyEpisode].station-1].tipp3}
            `;
            break;
    }

    // Tipp in Array sichern
    const tippObj = {
        station: spielerInfo.episoden[keyEpisode].station,
        tippNr: tippNr,
        zeitstempel: Date.now() 
    };
    spielerInfo.episoden[keyEpisode].tipps.push(tippObj);

    // Zeitstempel Episode generieren
    spielerInfo.episoden[keyEpisode].zeitstempel = Date.now();

    // Daten in Datenbank schreiben
    try {
        await fb.updateDocument("spieler", spielerUid, {
            [`episoden.${keyEpisode}`]: spielerInfo.episoden[keyEpisode]
        });
    } catch (error) {
        console.error(error);
        if (spielTipp) spielTipp.innerText = "Fehler beim anzeigen der Tipps.";

        // Tipp Knopf freigeben
        if (tippBtn) tippBtn.disabled = false;
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGOUT BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        // Abmeldung von Datenbank
        await fb.auth.signOut();

        // Weiterleiten zur Login Seite
        window.location.href = "index.html";
    } catch (error) {
        console.error("Fehler beim Logout:", error);
    }
});