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
fb.onAuthChanged(async (user) => {
    if (user) {
        spielerUid = user.uid;
        spielerInfo = await fb.getDocument("spieler", spielerUid);
        if (spielerInfo) {
            document.getElementById("spiel-bereich").style.display = "block";
            document.getElementById("spiel-begruessung").innerText = `Hallo ${spielerInfo.spielerName}`;

            zeigeFrage();
        }
    } else {
        // Nicht eingeloggt? Rauswurf zurück zur Loginseite!
        window.location.href = "index.html";
    }
});


// ---------------------------------------------
// --- EINMALIGE EVENT-LISTENER ---
// ---------------------------------------------
document.getElementById("spiel-tipp-btn").addEventListener("click", async () => {
    const spielTipp = document.getElementById("spiel-tipp");

    if (spielerInfo.fortschritt >= alleFragen.length) return;

    spielerInfo.tipps = (spielerInfo.tipps || 0) + 1;
    
    spielTipp.innerText = alleFragen[spielerInfo.fortschritt].tipp1 || "Kein Tipp verfügbar.";

    try {
        await fb.updateDocument("spieler", spielerUid, {
            tipps: spielerInfo.tipps,
        });
    } catch (error) {
        console.error(error);
        if (feedback) feedback.innerText = "Fehler beim Speichern der Tipps.";
    }
});


// ---------------------------------------------
// --- SPIEL LOGIK ---
// ---------------------------------------------
async function zeigeFrage() {
    spielStatus = await fb.getDocument("spielStatus", "global");
    spielerInfo = await fb.getDocument("spieler", spielerUid);
    await fragenLaden(spielerInfo.katalog);

    const container = document.getElementById("spiel-frage");
    const spielTipp = document.getElementById("spiel-tipp");

    document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
    if (spielStatus.adminNachricht !== "") {
        document.getElementById("admin-nachricht-display").style.display = "block";
    } else {
        document.getElementById("admin-nachricht-display").style.display = "none";
    }

    spielTipp.innerText = "";

    if (!spielStatus.freigegeben) {
        container.innerHTML = `
            <p>Station ${spielerInfo.fortschritt +1}</p>
            <h3>Das Spiel ist aktuell pausiert.</h3>
            <p>Bitte warte auf die Freigabe.</p>
            <button id="status-btn">Aktualisieren</button>
        `;
        document.getElementById("status-btn").addEventListener("click", () => location.reload());
        document.getElementById("spiel-tipp-container").style.display = "none";
    }
    else if (spielerInfo.fortschritt < alleFragen.length) {
        if (spielStatus.tipps) {
            document.getElementById("spiel-tipp-container").style.display = "block";
        } else {
            document.getElementById("spiel-tipp-container").style.display = "none";
        }

        container.innerHTML = `
            <p>Station ${spielerInfo.fortschritt +1}</p>
            <p>${alleFragen[spielerInfo.fortschritt].frage}</p>
            <textarea id="antwort-input" placeholder="Eure Antwort"></textarea>
            <button id="antwort-btn">Antwort senden</button>
            <p id="spiel-feedback" style="color:red;"></p>
        `;
        document.getElementById("antwort-btn").addEventListener("click", pruefeAntwort);
    }
    else {
        container.innerHTML = `<h3>Glückwunsch! Die Suche wurde erfolgreich gemeistert! 🎉</h3>`;
        document.getElementById("spiel-tipp-container").style.display = "none";
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
        // Button sperren, um Doppelklicks während des Uploads abzufangen
        if (antwortBtn) antwortBtn.disabled = true;

        spielerInfo.fortschritt++;
        try {
            await fb.updateDocument("spieler", fb.aktuelleUid, {
                fortschritt: spielerInfo.fortschritt,
                antworten: spielerInfo.antworten,
                zeitstempel: Date.now()
            });
            zeigeFrage();
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern des Fortschritts.";
            if (antwortBtn) antwortBtn.disabled = false;
        }
    } else {
        feedback.style.color = "red";
        feedback.innerText = "Falsche Antwort! Versucht es noch einmal.";

        if (antwortBtn) antwortBtn.disabled = true;

        try {
            await fb.updateDocument("spieler", fb.aktuelleUid, {
                antworten: spielerInfo.antworten
            });
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern des Fortschritts.";
        } finally {
            if (antwortBtn) antwortBtn.disabled = false;
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