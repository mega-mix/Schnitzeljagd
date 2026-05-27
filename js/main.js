import { Fragenkatalog } from "./classes/Fragenkatalog.js";
import { FirebaseService } from "./classes/FirebaseService.js";


// Instanzen der Services erstellen
const fb = new FirebaseService();
const katalog = new Fragenkatalog();

let aktuelleGruppe = "";
let aktuellerFortschritt = 0;

// --- LOGIN LOGIK ---
document.getElementById("loginBtn").addEventListener("click", async () => {
    const nameInput = document.getElementById("gruppenName").value.trim();
    const passInput = document.getElementById("passwort").value;
    const errorMsg = document.getElementById("errorMsg");

    if (!nameInput || !passInput) {
        errorMsg.innerText = "Bitte alles ausfüllen.";
        return;
    }

    if (nameInput.toLowerCase() === "admin" && passInput === "masterpasswort") {
        document.getElementById("loginBereich").style.display = "none";
        document.getElementById("adminBereich").style.display = "block";
        ladeAlleGruppen();
        return;
    }

    try {
        // HIER: Nutzung der neuen Service-Klasse
        const daten = await fb.getDocument("gruppen", nameInput);

        if (daten) {
            if (daten.passwort === passInput) {
                aktuelleGruppe = nameInput;
                aktuellerFortschritt = daten.fortschritt || 0;

                document.getElementById("loginBereich").style.display = "none";
                document.getElementById("spielBereich").style.display = "block";
                document.getElementById("begruessung").innerText = `Hallo ${aktuelleGruppe}`;
                
                zeigeFrage();
            } else {
                errorMsg.innerText = "Falsches Passwort.";
            }
        } else {
            errorMsg.innerText = "Gruppe existiert nicht.";
        }
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Laden der Daten.";
    }
});

// --- ADMIN LOGIK ---
async function ladeAlleGruppen() {
    const tabelleBody = document.getElementById("adminTabelleBody");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    try {
        // Alle Dokumente über den Service holen
        const alleGruppen = await fb.getAllDocuments("gruppen");
        let htmlInhalt = "";

        alleGruppen.forEach((gruppe) => {
            // gruppe.id ist der Dokumentenname, die restlichen Felder liegen direkt darauf
            if (gruppe.id.toLowerCase() !== "admin") {
                const fortschritt = gruppe.fortschritt !== undefined ? gruppe.fortschritt : 0;
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${gruppe.id}</td>
                        <td style="padding: 8px;">Station ${fortschritt +1}</td>
                    </tr>
                `;
            }
        });

        tabelleBody.innerHTML = htmlInhalt || "<tr><td colspan='2' style='padding:8px;'>Keine Gruppen gefunden.</td></tr>";
    } catch (error) {
        console.error(error);
        tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px; color:red;'>Fehler beim Abrufen der Gruppen.</td></tr>";
    }
}

document.getElementById("refreshAdminBtn").addEventListener("click", ladeAlleGruppen);

// --- SPIEL LOGIK ---
function zeigeFrage() {
    const container = document.getElementById("frageContainer");
    if (aktuellerFortschritt < katalog.anzahlFragen) {
        container.innerHTML = `
            <p>Station ${aktuellerFortschritt +1}</p>
            <p>${katalog.getFrage(aktuellerFortschritt)}</p>
            <input type="text" id="antwortInput" placeholder="Deine Antwort">
            <button id="antwortBtn">Antwort senden</button>
            <p id="spielFeedback" style="color:red;"></p>
        `;
        document.getElementById("antwortBtn").addEventListener("click", pruefeAntwort);
    } else {
        container.innerHTML = `<h3>Glückwunsch! Ihr habt den Tag mit Lea und Paul erfolgreich gemeistert! 🎉</h3>`;
    }
}

async function pruefeAntwort() {
    const spielerAntwort = document.getElementById("antwortInput").value;
    const feedback = document.getElementById("spielFeedback");

    if (katalog.pruefeAntwort(aktuellerFortschritt, spielerAntwort)) {
        aktuellerFortschritt++;
        try {
            // Update über die neue Service-Klasse ausführen
            await fb.updateDocument("gruppen", aktuelleGruppe, {
                fortschritt: aktuellerFortschritt
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