import { FirebaseService } from "./classes/FirebaseService.js";


// Instanzen der Services erstellen
const fb = new FirebaseService();

document.getElementById("version").innerText = "v 1.4.1";

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
        spielerInfo = await fb.getDocument("gruppen", spielerUid);
        if (spielerInfo) {
            if (spielerInfo.gruppenName === "admin") {
                document.getElementById("admin-bereich").style.display = "block";
                ladeAlleGruppen();
            }
        }
    } else {
        // Nicht eingeloggt? Rauswurf zurück zur Loginseite!
        window.location.href = "index.html";
    }
});


// ---------------------------------------------
// --- ADMIN LOGIK ---
// ---------------------------------------------
async function ladeAlleGruppen() {
    spielStatus = await fb.getDocument("spielStatus", "global");

    const tabelleBody = document.getElementById("admin-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    await fragenLaden(spielerInfo.katalog);
    document.getElementById("admin-menge-stationen").innerText = `Es gibt ${alleFragen.length} Stationen`;

    document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
    if (spielStatus.adminNachricht !== "") {
        document.getElementById("admin-nachricht-display").style.display = "block";
    } else {
        document.getElementById("admin-nachricht-display").style.display = "none";
    }

    if (spielStatus.freigegeben) {
        document.getElementById("admin-freigabe-btn").innerText = "Spiel pausieren";
    } else {
        document.getElementById("admin-freigabe-btn").innerText = "Spiel freigeben";
    }

    if (spielStatus.tipps) {
        document.getElementById("admin-tipp-btn").innerText = "Tipps sperren";
    } else {
        document.getElementById("admin-tipp-btn").innerText = "Tipps freigeben";
    }

    const status = document.getElementById("admin-status");
    const statusTipp = document.getElementById("admin-status-tipp");

    if (spielStatus.freigegeben) {
        status.innerText ="Spiel aktiv";
        status.style.color = "#2ECC71";
    } else {
        status.innerText ="Spiel pausiert";
        status.style.color = "#E74C3C";
    }

    if (spielStatus.tipps) {
        statusTipp.innerText ="Tipps aktiv";
        statusTipp.style.color = "#2ECC71";
    } else {
        statusTipp.innerText ="Tipps gesperrt";
        statusTipp.style.color = "#E74C3C";
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
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                }
                
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${gruppe.gruppenName}</td>
                        <td style="padding: 8px;">${gruppe.katalog}</td>
                        <td style="padding: 8px;">${fortschritt + 1}</td>
                        <td style="padding: 8px;">${gruppe.tipps}</td>
                        <td style="padding: 8px;">${gruppe.antworten}</td>
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

document.getElementById("admin-freigabe-btn").addEventListener("click", async () => {
    await fb.setzeSpielStatus(!spielStatus.freigegeben);
    ladeAlleGruppen();
});

document.getElementById("admin-tipp-btn").addEventListener("click", async () => {
    await fb.setzeTippStatus(!spielStatus.tipps);
    ladeAlleGruppen();
});

document.getElementById("admin-spieler-btn").addEventListener("click", () => {
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-spieler-bereich").style.display = "block";
});


// ---------------------------------------------
// --- GRUPPE BEARBEITEN ---
// ---------------------------------------------
document.getElementById("spieler-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-spieler-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("admin-spieler-btn").addEventListener("click", async () => {
    const tabelleBody = document.getElementById("spieler-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    try {
        const alleGruppen = await fb.getAllDocuments("gruppen");
        let htmlInhalt = "";

        alleGruppen.forEach((gruppe) => {
            if (gruppe.gruppenName) {
                let lastLogin = "--.--.--, --:--:--"
                
                if (gruppe.lastLogin) {
                    lastLogin = new Date(gruppe.lastLogin).toLocaleTimeString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                }
                
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${gruppe.gruppenName}</td> 
                        <td style="padding: 8px;">${lastLogin}</td>
                    </tr>
                `;
            }
        });

        tabelleBody.innerHTML = htmlInhalt || "<tr><td colspan='2' style='padding:8px;'>Keine Spieler gefunden.</td></tr>";
    } catch (error) {
        console.error(error);
        tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px; color:red;'>Fehler beim Abrufen der Spieler.</td></tr>";
    }
});


// ---------------------------------------------
// --- GRUPPE BEARBEITEN ---
// ---------------------------------------------
document.getElementById("bearbeiten-abort-btn").addEventListener("click", () => {
    document.getElementById("bearbeiten-error-msg").innerText = "";
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
    const katalogInput = parseInt(document.getElementById("bearbeiten-katalog").value);
    const antwortenInput = parseInt(document.getElementById("bearbeiten-antworten").value);
    const errorMsg = document.getElementById("bearbeiten-error-msg");

    if (!nameInput || !stationInput || !katalogInput || isNaN(antwortenInput)) {
        errorMsg.innerText = "Bitte alle Felder ausfüllen.";
        return;
    } else {
        try {
            const alleGruppen = await fb.getAllDocuments("gruppen");
            const gefundeneGruppe = alleGruppen.find(g => g.gruppenName === nameInput);

            if (gefundeneGruppe) {
                if (stationInput >= 1) {
                    // Update über die UID (gefundeneGruppe.id) abschicken
                    await fb.updateDocument("gruppen", gefundeneGruppe.id, {
                        fortschritt: (stationInput -1),
                        katalog: katalogInput,
                        antworten: antwortenInput,
                        zeitstempel: Date.now()
                    });
                }

                document.getElementById("bearbeiten-name").value = "";
                document.getElementById("bearbeiten-fortschritt").value = "";
                document.getElementById("bearbeiten-katalog").value = "";
                document.getElementById("bearbeiten-antworten").value = "";
                errorMsg.innerText = "";
                document.getElementById("admin-bearbeiten-bereich").style.display = "none";
                document.getElementById("admin-bereich").style.display = "block";
                ladeAlleGruppen();
            } else {
                errorMsg.innerText = "Gruppenname nicht gefunden.";
                return;
            }
        } catch (error) {
            console.error(error);
            errorMsg.innerText = "Fehler beim Speichern der Daten.";
        }
    }
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
    const katalog = document.getElementById("fragen-katalog-laden").value;

    fragenLaden(katalog);

    if (index >= alleFragen.length) return;

    document.getElementById("fragen-frage").value = alleFragen[index].frage;
    document.getElementById("fragen-antwort").value = alleFragen[index].antwort;
    document.getElementById("fragen-nummer").value = index;
    document.getElementById("fragen-katalog").value = katalog;
});

document.getElementById("fragen-save-btn").addEventListener("click", async () => {
    const frageInput = document.getElementById("fragen-frage").value;
    const antwortInput = document.getElementById("fragen-antwort").value;
    const indexInput = document.getElementById("fragen-nummer").value;
    const katalogInput = document.getElementById("fragen-katalog").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    if (!frageInput || !antwortInput || !indexInput) {
        errorMsg.innerText = "Bitte Frage, Antwort und Index angeben!";
        return;
    }

    const neueFrage = {
        frage: frageInput,
        antwort: antwortInput
    };

    const katalogPath = "fragen" + katalogInput;

    try {
        const checkExists = await fb.getDocument(katalogPath, indexInput.toString());

        if (checkExists !== null) {
            await fb.updateDocument(katalogPath, indexInput.toString(), neueFrage);
        } else {
            await fb.createDocument(katalogPath, indexInput.toString(), neueFrage);
        }

        errorMsg.innerText = "";
    } catch (error) {
        console.error("Daten werden nicht geladen:", error);
        errorMsg.innerText = "Fehler beim speichern der Daten.";
    } 
    
});

document.getElementById("fragen-delete-btn").addEventListener("click", async () => {
    const indexInput = document.getElementById("fragen-nummer").value;
    const katalogInput = document.getElementById("fragen-katalog").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    if (!indexInput) {
        errorMsg.innerText = "Bitte Index zum löschen angeben!";
        return;
    }

    const entscheidung = confirm(`Möchten Sie die Frage ${indexInput} wirklich löschen?`);
    if (!entscheidung) return;

    const katalogPath = "fragen" + katalogInput;

    try {
        const checkExists = await fb.getDocument(katalogPath, indexInput.toString());

        if (checkExists !== null) {
            await fb.deleteDocument(katalogPath, indexInput.toString());
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