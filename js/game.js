import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleFragen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";
const anzahlAntwortenSpeicher = 50; // Grenze für gespeicherte Antworten


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
            spielerInfo = await fb.getSpielerInfo(spielerUid);
            if (spielerInfo) {
                await fragenLaden(spielerInfo.aktiveEpisode);
                await zeigeFrage();
            } else {
                windows.location.href = "index.html";
            }
        } catch (error) {
            console.error("Fehler bei der Auth-Initialisierung:", error);
        }
    } else {
        window.location.href = "index.html";
    }
});


// ---------------------------------------------
// --- SPIEL LOGIK ---
// ---------------------------------------------
async function zeigeFrage() {
    const spielBereich = document.getElementById("spiel-bereich");
    const container = document.getElementById("spiel-frage");
    const spielTipp = document.getElementById("spiel-tipp");
    const spielTippBtn = document.getElementById("spiel-tipp-btn");

    try {
        spielStatus = await fb.getSpielStatus();
        const neueSpielerInfo = await fb.getSpielerInfo(spielerUid);

        if (!neueSpielerInfo || !spielStatus) return;

        if (spielerInfo.aktiveEpisode !== neueSpielerInfo.aktiveEpisode) {
            await fragenLaden(neueSpielerInfo.aktiveEpisode);
        }

        spielerInfo = neueSpielerInfo;

        document.getElementById("spiel-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;
        document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;

        if (spielStatus.adminNachricht !== "") {
            document.getElementById("admin-nachricht-display").style.display = "block";
        } else {
            document.getElementById("admin-nachricht-display").style.display = "none";
        }
    
        const keyEpisode = spielerInfo.aktiveEpisode;
        const spielerEpisode = spielerInfo.episoden[keyEpisode];
        const indexStation = spielerInfo.episoden[keyEpisode].station -1;

        // Tipp 1 anzeigen oder nicht
        const indexTipp = spielerInfo.episoden[keyEpisode].tipps.findIndex(tp => tp.station === spielerInfo.episoden[keyEpisode].station);
        if (indexTipp >= 0) {
            const tippNr = spielerInfo.episoden[keyEpisode].tipps[indexTipp].tippNr;
            switch (tippNr) {
                case 1:
                    spielTippBtn.disabled = true;
                    spielTipp.innerText = alleFragen[spielerInfo.episoden[keyEpisode].station-1].tipp1 || "Kein Tipp verfügbar.";
                    break;
            }
        } else {
            spielTippBtn.disabled = false;
            spielTipp.innerText = "";
        }

        if (!spielStatus.freigegeben) {
            container.innerHTML = `
                <p>Station ${spielerEpisode.station}</p>
                <h3>Das Spiel ist aktuell pausiert.</h3>
                <p>Bitte warte auf die Freigabe.</p>
                <button id="status-btn">Aktualisieren</button>
            `;
            document.getElementById("spiel-tipp-container").style.display = "none";
        }
        else if (spielerEpisode.station <= alleFragen.length) {
            if (spielStatus.tipps) {
                document.getElementById("spiel-tipp-container").style.display = "block";
            } else {
                document.getElementById("spiel-tipp-container").style.display = "none";
            }

            container.innerHTML = `
                <p>Station ${spielerEpisode.station }</p>
                <p>${alleFragen[spielerEpisode.station-1].frage}</p>
                <textarea id="antwort-input" placeholder="Eure Antwort"></textarea>
                <button id="antwort-btn">Antwort senden</button>
                <p id="spiel-feedback" style="color:red;"></p>
            `;
        }
        else {
            container.innerHTML = `<h3>Glückwunsch! Die Suche wurde erfolgreich gemeistert! 🎉</h3>`;
            document.getElementById("spiel-tipp-container").style.display = "none";
        }

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
    const indexStation = spielerInfo.episoden[keyEpisode].station -1;

    // Antwort mit Lösung vergleichen
    if (spielerInfo.episoden[keyEpisode].station <= alleFragen.length) {
        const korrekteAntwort = alleFragen[spielerInfo.episoden[keyEpisode].station-1].antwort.toLowerCase().trim();
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

        // Daten speichern
        try {
            await fb.updateDocument("spieler", spielerUid, {
                [`episoden.${keyEpisode}`]: spielerInfo.episoden[keyEpisode]
            });
            await zeigeFrage();
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern der Station.";
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

        // Daten speichern
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

async function fragenLaden(episode) {
    try {
        const episodePath = "episode" + episode;
        const geladeneFragen = await fb.getAllDocuments(episodePath);

        alleFragen = geladeneFragen.sort((a, b) => {
            return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
    } catch (error) {
        console.error("Fehler beim Laden der Fragen:", error);
    }
}


// ---------------------------------------------
// --- GLOBALER KLICK-WATCHER (Event Delegation) ---
// ---------------------------------------------
document.addEventListener("click", async (event) => {
    // 1. Abfangen des dynamischen Antwort-Buttons
    if (event.target && event.target.id === "antwort-btn") {
        await pruefeAntwort();
    }
    
    // 2. Abfangen des dynamischen Pausen-Aktualisieren-Buttons
    if (event.target && event.target.id === "status-btn") {
        location.reload();
    }
});


// ---------------------------------------------
// --- TIPP BUTTON ---
// ---------------------------------------------
document.getElementById("spiel-tipp-btn").addEventListener("click", async () => {
    const spielTipp = document.getElementById("spiel-tipp");
    const tippBtn = document.getElementById("spiel-tipp-btn");

    // Abbruch bei fehlenden spielerInfo oder alleFragen
    if (!spielerInfo || alleFragen.length === 0) return; 

    // Indexe speichern
    const keyEpisode = spielerInfo.aktiveEpisode;
    const indexStation = spielerInfo.episoden[keyEpisode].station -1;

    // Abbruch bei fehlerhaften Werten
    if (spielerInfo.episoden[keyEpisode].station === undefined || spielerInfo.episoden[keyEpisode].station > alleFragen.length) return;

    // Tipp Knopf deaktivieren
    if (tippBtn) tippBtn.disabled = true;

    // Tipp in Array sichern
    const tippObj = {
        station: spielerInfo.episoden[keyEpisode].station,
        tippNr: 1,
        zeitstempel: Date.now() 
    };
    spielerInfo.episoden[keyEpisode].tipps.push(tippObj);

    // Tipp anzeigen
    spielTipp.innerText = alleFragen[spielerInfo.episoden[keyEpisode].station-1].tipp1 || "Kein Tipp verfügbar.";

    // Zeitstempel generieren
    spielerInfo.episoden[keyEpisode].zeitstempel = Date.now();

    // Daten speichern
    try {
        await fb.updateDocument("spieler", spielerUid, {
            [`episoden.${keyEpisode}`]: spielerInfo.episoden[keyEpisode]
        });
    } catch (error) {
        console.error(error);
        if (spielTipp) spielTipp.innerText = "Fehler beim Speichern der Tipps.";
        if (tippBtn) tippBtn.disabled = false;
    }
});

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