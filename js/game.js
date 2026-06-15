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
                await fragenLaden(spielerInfo.katalog);
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
        spielStatus = await fb.getDocument("spielStatus", "global");
        const neueSpielerInfo = await fb.getDocument("spieler", spielerUid);

        if (!neueSpielerInfo || !spielStatus) return;

        if (spielerInfo.katalog !== neueSpielerInfo.katalog) {
            await fragenLaden(neueSpielerInfo.katalog);
        }

        spielerInfo = neueSpielerInfo;

        document.getElementById("spiel-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;
        document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;

        if (spielStatus.adminNachricht !== "") {
            document.getElementById("admin-nachricht-display").style.display = "block";
        } else {
            document.getElementById("admin-nachricht-display").style.display = "none";
        }

        spielTipp.innerText = "";
        if (spielTippBtn) spielTippBtn.disabled = false;

        if (!spielStatus.freigegeben) {
            container.innerHTML = `
                <p>Station ${spielerInfo.fortschritt + 1}</p>
                <h3>Das Spiel ist aktuell pausiert.</h3>
                <p>Bitte warte auf die Freigabe.</p>
                <button id="status-btn">Aktualisieren</button>
            `;
            document.getElementById("spiel-tipp-container").style.display = "none";
        }
        else if (spielerInfo.fortschritt < alleFragen.length) {
            if (spielStatus.tipps) {
                document.getElementById("spiel-tipp-container").style.display = "block";
                if (spielTippBtn) spielTippBtn.disabled = false;
            } else {
                document.getElementById("spiel-tipp-container").style.display = "none";
            }

            container.innerHTML = `
                <p>Station ${spielerInfo.fortschritt + 1}</p>
                <p>${alleFragen[spielerInfo.fortschritt].frage}</p>
                <textarea id="antwort-input" placeholder="Eure Antwort"></textarea>
                <button id="antwort-btn">Antwort senden</button>
                <p id="spiel-feedback" style="color:red;"></p>
            `;
            // KEIN addEventListener hier drin! Wird jetzt global unten geregelt.
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
    let istRichtig = false;

    if (spielerInfo.fortschritt < alleFragen.length) {
        const korrekteAntwort = alleFragen[spielerInfo.fortschritt].antwort.toLowerCase().trim();
        const bereinigteSpielerAntwort = spielerAntwort.toLowerCase().trim();
        istRichtig = bereinigteSpielerAntwort === korrekteAntwort;
    }

    spielerInfo.antworten = (spielerInfo.antworten || 0) + 1;

    if (istRichtig) {
        if (antwortBtn) {
            antwortBtn.disabled = true;
            antwortBtn.innerText = "Bitte warten...";
        }

        spielerInfo.fortschritt++;
        try {
            await fb.updateDocument("spieler", spielerUid, {
                fortschritt: spielerInfo.fortschritt,
                antworten: spielerInfo.antworten,
                zeitstempel: Date.now()
            });
            await zeigeFrage();
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern des Fortschritts.";
            if (antwortBtn) {
                antwortBtn.disabled = false;
                antwortBtn.innerText = "Antwort senden";
            }
        }
    } else {
        feedback.style.color = "red";
        feedback.innerText = "Falsche Antwort! Versucht es noch einmal.";

        feedback.classList.remove("shake-blink");
        void feedback.offsetWidth;
        feedback.classList.add("shake-blink");

        if (antwortBtn) {
            antwortBtn.classList.remove("btn-error-flash");
            void antwortBtn.offsetWidth;
            antwortBtn.classList.add("btn-error-flash");
            antwortBtn.disabled = true;
        }

        try {
            await fb.updateDocument("spieler", spielerUid, {
                antworten: spielerInfo.antworten
            });
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern des Fortschritts.";
        } finally {
            if (antwortBtn) {
                antwortBtn.disabled = false;
                antwortBtn.innerText = "Antwort senden";
            }
        }
    }
}

async function fragenLaden(katalog) {
    try {
        const katalogPath = "fragen" + katalog;
        const geladeneFragen = await fb.getAllDocuments(katalogPath);

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

    if (!spielerInfo || alleFragen.length === 0) return; 
    if (spielerInfo.fortschritt === undefined || spielerInfo.fortschritt >= alleFragen.length) return;

    if (tippBtn) tippBtn.disabled = true;

    spielerInfo.tipps = (spielerInfo.tipps || 0) + 1;
    spielTipp.innerText = alleFragen[spielerInfo.fortschritt].tipp1 || "Kein Tipp verfügbar.";

    try {
        await fb.updateDocument("spieler", spielerUid, {
            tipps: spielerInfo.tipps,
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