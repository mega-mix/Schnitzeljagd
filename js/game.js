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

            document.getElementById("spiel-bereich").style.display = "block";
            document.getElementById("spiel-begruessung").innerText = `Hallo ${aktuelleGruppe}`;

            zeigeFrage();
        }
    } else {
        // Nicht eingeloggt? Rauswurf zurück zur Loginseite!
        window.location.href = "index.html";
    }
});


// ---------------------------------------------
// --- SPIEL LOGIK ---
// ---------------------------------------------
async function zeigeFrage() {
    const container = document.getElementById("spiel-frage");
    const freigegeben = await fb.istSpielFreigegeben();
    const adminNachricht = await fb.getAdminNachricht();

    if (adminNachricht !== "") {
        document.getElementById("admin-nachricht-display").style.display = "block";
        document.getElementById("admin-nachricht-display").innerText = adminNachricht;
    } else {
        document.getElementById("admin-nachricht-display").style.display = "none";
    }

    await fragenLaden(katalogNr);

    if (!freigegeben) {
        container.innerHTML = `
            <p>Station ${aktuellerFortschritt +1}</p>
            <h3>Das Spiel ist aktuell pausiert.</h3>
            <p>Bitte warte auf die Freigabe von Björn.</p>
            <button id="status-btn">Aktualisieren</button>
        `;
        document.getElementById("status-btn").addEventListener("click", () => location.reload());
    }
    else if (aktuellerFortschritt < alleFragen.length) {
        // Sonderform für Holland!
        if (aktuellerFortschritt < 14) {
            container.innerHTML = `
                <p>Station ${aktuellerFortschritt +1}</p>
                <p>${alleFragen[aktuellerFortschritt].frage}</p>
                <textarea id="antwort-input" placeholder="Eure Antwort"></textarea>
                <button id="antwort-btn">Antwort senden</button>
                <p id="spiel-feedback" style="color:red;"></p>
            `;
            document.getElementById("antwort-btn").addEventListener("click", pruefeAntwort);
        } else {
            container.innerHTML = `
                <p>Station ${aktuellerFortschritt +1}</p>
                <p>${alleFragen[aktuellerFortschritt].frage}</p>
                <p id="spiel-feedback" style="color:red;"></p>
            `;
        }
    }
    else {
        container.innerHTML = `<h3>Glückwunsch! Ihr habt die Suche erfolgreich gemeistert! 🎉</h3>`;
    }
}

async function pruefeAntwort() {
    const spielerAntwort = document.getElementById("antwort-input").value;
    const feedback = document.getElementById("spiel-feedback");
    let istRichtig = false;

    if (aktuellerFortschritt < alleFragen.length) {
        const korrekteAntwort = alleFragen[aktuellerFortschritt].antwort.toLowerCase().trim();
        const bereinigteSpielerAntwort = spielerAntwort.toLowerCase().trim();
        istRichtig = bereinigteSpielerAntwort === korrekteAntwort;
    }

    if (istRichtig) {
        aktuellerFortschritt++;
        try {
            await fb.updateDocument("gruppen", fb.aktuelleUid, {
                fortschritt: aktuellerFortschritt,
                zeitstempel: Date.now()
            });
            zeigeFrage();
        } catch (error) {
            console.error(error);
            feedback.innerText = "Fehler beim Speichern des Fortschritts.";
        }
    } else {
        feedback.style.color = "red";
        feedback.innerText = "Falsche Antwort! Versucht es noch einmal.";
    }
}

async function fragenLaden(katalogNr) {
    try {
        const katalogPath = "fragen" + katalogNr;
        const geladeneFragen = await fb.getAllDocuments(katalogPath);

        alleFragen = geladeneFragen.sort((a, b) => {
            return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
    } catch (error) {
        console.error("Fehler beim Laden der Fragen:", error);
    }
}