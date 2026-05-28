import { FirebaseService } from "./classes/FirebaseService.js";


// Instanzen der Services erstellen
const fb = new FirebaseService();

document.getElementById("version").innerText = "v 1.1.2";

let aktuelleGruppe = "";
let aktuellerFortschritt = 0;
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
            await fragenLaden();

            const freigegeben = await fb.istSpielFreigegeben();

            if (aktuelleGruppe === "admin") {
                document.getElementById("admin-bereich").style.display = "block";
                ladeAlleGruppen();
                return;
            }

            document.getElementById("spiel-bereich").style.display = "block";
            document.getElementById("spiel-begruessung").innerText = `Hallo ${aktuelleGruppe}`;


            zeigeFrage();
        }
    } else {
        // Nicht eingeloggt? Rauswurf zurück zur Startseite!
        window.location.href = "index.html";
    }
});


// ---------------------------------------------
// --- ADMIN LOGIK ---
// ---------------------------------------------
async function ladeAlleGruppen() {
    const tabelleBody = document.getElementById("admin-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    await fragenLaden();
    document.getElementById("admin-menge-stationen").innerText = `Es gibt ${alleFragen.length} Stationen`;

    const adminNachricht = await fb.getAdminNachricht();

    if (adminNachricht !== "") {
        document.getElementById("admin-nachricht-display").style.display = "block";
        document.getElementById("admin-nachricht-display").innerText = adminNachricht;
    } else {
        document.getElementById("admin-nachricht-display").style.display = "none";
    }

    const freigegeben = await fb.istSpielFreigegeben();

    if (freigegeben) {
        document.getElementById("admin-pause-btn").style.display = "block";
        document.getElementById("admin-freigabe-btn").style.display = "none";
    } else {
        document.getElementById("admin-pause-btn").style.display = "none";
        document.getElementById("admin-freigabe-btn").style.display = "block";
    }

    const status = document.getElementById("admin-status");

    if (freigegeben) {
        status.innerText ="Spiel aktiv";
        status.style.color = "#2ECC71";
    } else {
        status.innerText ="Spiel pausiert";
        status.style.color = "#E74C3C";
    }

    try {
        const alleGruppen = await fb.getAllDocuments("gruppen");
        let htmlInhalt = "";

        alleGruppen.forEach((gruppe) => {
            if (gruppe.gruppenName && gruppe.gruppenName.toLowerCase() !== "admin") {
                let uhrzeit = "--.--., --:--:--"
                const fortschritt = gruppe.fortschritt !== undefined ? gruppe.fortschritt : 0;
                if (gruppe.zeitstempel) {
                    uhrzeit = new Date(gruppe.zeitstempel).toLocaleTimeString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                }
                
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${gruppe.gruppenName}</td> 
                        <td style="padding: 8px;">Station ${fortschritt + 1}</td>
                        <td style="padding: 8px;">${uhrzeit}</td>
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

document.getElementById("admin-refresh-btn").addEventListener("click", ladeAlleGruppen);

document.getElementById("admin-bearbeiten-btn").addEventListener("click", () => {
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-bearbeiten-bereich").style.display = "block";
});

document.getElementById("admin-fragen-btn").addEventListener("click", () => {
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-fragen-bereich").style.display = "block";
});

document.getElementById("admin-nachricht-btn").addEventListener("click", async () => {
    document.getElementById("admin-nachricht").value = await fb.getAdminNachricht();
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-nachricht-bereich").style.display = "block";
});

document.getElementById("admin-pause-btn").addEventListener("click", async () => {
    await fb.setzeSpielStatus(false);
    ladeAlleGruppen();
});

document.getElementById("admin-freigabe-btn").addEventListener("click", async () => {
    await fb.setzeSpielStatus(true);
    ladeAlleGruppen();
});


// ---------------------------------------------
// --- GRUPPE BEARBEITEN ---
// ---------------------------------------------
document.getElementById("bearbeiten-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-bearbeiten-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("bearbeiten-delete-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("bearbeiten-name").value.trim();
    const errorMsg = document.getElementById("bearbeiten-error-msg");

    try {
        // Alle Dokumente holen, um das mit dem richtigen Namen zu finden
        const alleGruppen = await fb.getAllDocuments("gruppen");
        const gefundeneGruppe = alleGruppen.find(g => g.gruppenName === nameInput);

        if (gefundeneGruppe) {
            // gefundeneGruppe.id enthält die korrekte UID für den Löschbefehl
            await fb.deleteDocument("gruppen", gefundeneGruppe.id);
            alert(`Gruppe ${nameInput} gelöscht.`);
        } else {
            errorMsg.innerText = "Gruppenname nicht gefunden.";
            return;
        }
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Löschen der Daten.";
    }

    errorMsg.innerText = "";
    document.getElementById("admin-bearbeiten-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("bearbeiten-save-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("bearbeiten-name").value.trim();
    const stationInput = parseInt(document.getElementById("bearbeiten-fortschritt").value);
    const errorMsg = document.getElementById("bearbeiten-error-msg");

    try {
        const alleGruppen = await fb.getAllDocuments("gruppen");
        const gefundeneGruppe = alleGruppen.find(g => g.gruppenName === nameInput);

        if (gefundeneGruppe) {
            if (stationInput >= 1) {
                // Update über die UID (gefundeneGruppe.id) abschicken
                await fb.updateDocument("gruppen", gefundeneGruppe.id, {
                    fortschritt: (stationInput - 1),
                    zeitstempel: Date.now()
                });
            }
        } else {
            errorMsg.innerText = "Gruppenname nicht gefunden.";
            return;
        }
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der Daten.";
    }

    document.getElementById("bearbeiten-name").value = "";
    document.getElementById("bearbeiten-fortschritt").value = "";
    errorMsg.innerText = "";
    document.getElementById("admin-bearbeiten-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
    ladeAlleGruppen();
});


// ---------------------------------------------
// --- ADMIN NACHRICHT BEREICH ---
// ---------------------------------------------
document.getElementById("nachricht-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-nachricht-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("nachricht-save-btn").addEventListener("click", async () => {
    const nachrichtInput = document.getElementById("admin-nachricht").value.trim();
    const errorMsg = document.getElementById("nachrichten-error-msg");

    try {
        fb.setzeAdminNachricht(nachrichtInput);

    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der Daten.";
    }

    errorMsg.innerText = "";
    document.getElementById("admin-nachricht-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
    ladeAlleGruppen();
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

    await fragenLaden();

    if (!freigegeben) {
        container.innerHTML = `
            <p>Station ${aktuellerFortschritt +1}</p>
            <h3>Das Spiel ist aktuell pausiert.</h3>
            <p>Bitte warte auf die Freigabe von Björn.</p>
            <button id="status-btn">Aktualisieren</button>
        `;
        document.getElementById("status-btn").addEventListener("click", zeigeFrage);
    }
    else if (aktuellerFortschritt < alleFragen.length) {
        container.innerHTML = `
            <p>Station ${aktuellerFortschritt +1}</p>
            <p>${alleFragen[aktuellerFortschritt].frage}</p>
            <textarea id="antwort-input" placeholder="Eure Antwort"></textarea>
            <button id="antwort-btn">Antwort senden</button>
            <p id="spiel-feedback" style="color:red;"></p>
        `;
        document.getElementById("antwort-btn").addEventListener("click", pruefeAntwort);
    }
    else {
        container.innerHTML = `<h3>Glückwunsch! Ihr habt den Tag mit Lea und Paul erfolgreich gemeistert! 🎉</h3>`;
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

async function fragenLaden() {
    try {
        const geladeneFragen = await fb.getAllDocuments("fragen");

        alleFragen = geladeneFragen.sort((a, b) => {
            return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
    } catch (error) {
        console.error("Fehler beim Laden der Fragen:", error);
    }
}


// ---------------------------------------------
// --- FRAGEN BEARBEITEN ---
// ---------------------------------------------
document.getElementById("fragen-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-fragen-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
    document.getElementById("fragen-frage").value = "";
    document.getElementById("fragen-antwort").value = "";
    document.getElementById("fragen-nummer").value = "";
    document.getElementById("fragen-error-msg").innerText = "";
    document.getElementById("fragen-nummer-laden").value = 0;
});

document.getElementById("fragen-laden-btn").addEventListener("click", () => {
    const index = document.getElementById("fragen-nummer-laden").value;

    if (index >= alleFragen.length) return;

    document.getElementById("fragen-frage").value = alleFragen[index].frage;
    document.getElementById("fragen-antwort").value = alleFragen[index].antwort;
    document.getElementById("fragen-nummer").value = index;
});

document.getElementById("fragen-save-btn").addEventListener("click", async () => {
    const frageInput = document.getElementById("fragen-frage").value;
    const antwortInput = document.getElementById("fragen-antwort").value;
    const indexInput = document.getElementById("fragen-nummer").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    if (!frageInput || !antwortInput || !indexInput) {
        errorMsg.innerText = "Bitte Frage, Antwort und Index angeben!";
        return;
    }

    const neueFrage = {
        frage: frageInput,
        antwort: antwortInput
    };

    try {
        const checkExists = await fb.getDocument("fragen", indexInput.toString());

        if (checkExists !== null) {
            await fb.updateDocument("fragen", indexInput.toString(), neueFrage);
        } else {
            await fb.createDocument("fragen", indexInput.toString(), neueFrage);
        }

        errorMsg.innerText = "";
    } catch (error) {
        console.error("Daten werden nicht geladen:", error);
        errorMsg.innerText = "Fehler beim speichern der Daten.";
    } 
    
});

document.getElementById("fragen-delete-btn").addEventListener("click", async () => {
    const indexInput = document.getElementById("fragen-nummer").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    if (!indexInput) {
        errorMsg.innerText = "Bitte Index zum löschen angeben!";
        return;
    }

    const entscheidung = confirm(`Möchten Sie die Frage ${indexInput} wirklich löschen?`);
    if (!entscheidung) return;

    try {
        const checkExists = await fb.getDocument("fragen", indexInput.toString());

        if (checkExists !== null) {
            await fb.deleteDocument("fragen", indexInput.toString());
        } else {
            errorMsg.innerText = "Datei existiert nicht!";
            return;
        }

        errorMsg.innerText = "";
    } catch (error) {
        console.error("Daten werden nicht gelöscht:", error);
        errorMsg.innerText = "Fehler beim löschen der Daten.";
    } 
});