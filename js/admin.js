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
            if (spielerInfo.spielerName === "admin") {
                document.getElementById("admin-bereich").style.display = "block";
                ladeAlleSpieler();
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
async function ladeAlleSpieler() {
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
        const alleSpieler = await fb.getAllDocuments("spieler");
        let htmlInhalt = "";

        alleSpieler.forEach((spieler) => {
            if (spieler.spielerName && spieler.spielerName.toLowerCase() !== "admin") {
                let uhrzeit = "--.--., --:--:--"
                const fortschritt = spieler.fortschritt !== undefined ? spieler.fortschritt : 0;

                if (spieler.zeitstempel) {
                    uhrzeit = new Date(spieler.zeitstempel).toLocaleTimeString("de-DE", {
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
                        <td style="padding: 8px;">${spieler.spielerName}</td>
                        <td style="padding: 8px;">${spieler.katalog}</td>
                        <td style="padding: 8px;">${fortschritt + 1}</td>
                        <td style="padding: 8px;">${spieler.tipps}</td>
                        <td style="padding: 8px;">${spieler.antworten}</td>
                        <td style="padding: 8px;">${uhrzeit}</td>
                    </tr>
                `;
            }
        });

        tabelleBody.innerHTML = htmlInhalt || "<tr><td colspan='2' style='padding:8px;'>Kein Spieler gefunden.</td></tr>";
    } catch (error) {
        console.error(error);
        tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px; color:red;'>Fehler beim Abrufen der Spieler.</td></tr>";
    }
}

document.getElementById("admin-refresh-btn").addEventListener("click", ladeAlleSpieler);

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
    ladeAlleSpieler();
});

document.getElementById("admin-tipp-btn").addEventListener("click", async () => {
    await fb.setzeTippStatus(!spielStatus.tipps);
    ladeAlleSpieler();
});

document.getElementById("admin-spieler-btn").addEventListener("click", () => {
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-spieler-bereich").style.display = "block";
});


// ---------------------------------------------
// --- SPIELER ZEIGEN ---
// ---------------------------------------------
document.getElementById("spieler-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-spieler-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("admin-spieler-btn").addEventListener("click", async () => {
    const tabelleBody = document.getElementById("spieler-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    try {
        const alleSpieler = await fb.getAllDocuments("spieler");
        let htmlInhalt = "";

        alleSpieler.forEach((spieler) => {
            if (spieler.spielerName) {
                let lastLogin = "--.--.--, --:--:--"
                
                if (spieler.lastLogin) {
                    lastLogin = new Date(spieler.lastLogin).toLocaleTimeString("de-DE", {
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
                        <td style="padding: 8px;">${spieler.spielerName}</td> 
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
// --- SPIELER BEARBEITEN ---
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
        const alleSpieler = await fb.getAllDocuments("spieler");
        const gefundeneSpieler = alleSpieler.find(s => s.spielerName === nameInput);

        if (gefundeneSpieler) {
            await fb.deleteDocument("spieler", gefundeneSpieler.id);
            alert(`Spieler ${nameInput} gelöscht.`);
        } else {
            errorMsg.innerText = "Spielername nicht gefunden.";
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
    const tippInput = parseInt(document.getElementById("bearbeiten-tipp").value);
    const errorMsg = document.getElementById("bearbeiten-error-msg");

    if (!nameInput || !stationInput || !katalogInput || isNaN(antwortenInput)) {
        errorMsg.innerText = "Bitte alle Felder ausfüllen.";
        return;
    } else {
        const bearbeitenSaveBtn = document.getElementById("bearbeiten-save-btn");
        bearbeitenSaveBtn.disabled = true;
        bearbeitenSaveBtn.innerText = "Bitte warten...";

        try {
            const alleSpieler = await fb.getAllDocuments("spieler");
            const gefundeneSpieler = alleSpieler.find(s => s.spielerName === nameInput);

            if (gefundeneSpieler) {
                if (stationInput >= 1) {
                    await fb.updateDocument("spieler", gefundeneSpieler.id, {
                        fortschritt: (stationInput -1),
                        katalog: katalogInput,
                        antworten: antwortenInput,
                        tipps: tippInput,
                        zeitstempel: Date.now()
                    });
                }

                document.getElementById("bearbeiten-name").value = "";
                document.getElementById("bearbeiten-fortschritt").value = "";
                document.getElementById("bearbeiten-katalog").value = "";
                document.getElementById("bearbeiten-antworten").value = "";
                document.getElementById("bearbeiten-tipp").value = "";
                errorMsg.innerText = "";
                document.getElementById("admin-bearbeiten-bereich").style.display = "none";
                document.getElementById("admin-bereich").style.display = "block";
                ladeAlleSpieler();

                bearbeitenSaveBtn.disabled = false;
                bearbeitenSaveBtn.innerText = "Speichern";
            } else {
                errorMsg.innerText = "Spielername nicht gefunden.";
                return;
            }
        } catch (error) {
            console.error(error);
            errorMsg.innerText = "Fehler beim Speichern der Daten.";
            bearbeitenSaveBtn.disabled = false;
            bearbeitenSaveBtn.innerText = "Speichern";
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

    const nachrichtSaveBtn = document.getElementById("nachricht-save-btn");
    nachrichtSaveBtn.disabled = true;
    nachrichtSaveBtn.innerText = "Bitte warten";

    try {
        await fb.setzeAdminNachricht(nachrichtInput);

        errorMsg.innerText = "";
        document.getElementById("admin-nachricht-bereich").style.display = "none";
        document.getElementById("admin-bereich").style.display = "block";
        ladeAlleSpieler();

        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der Daten.";
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    }
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

document.getElementById("fragen-laden-btn").addEventListener("click", async () => {
    const index = document.getElementById("fragen-nummer-laden").value -1;
    const katalog = document.getElementById("fragen-katalog-laden").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    const fragenLadenBtn = document.getElementById("fragen-laden-btn");
    fragenLadenBtn.disabled = true;
    fragenLadenBtn.innerText = "Bitte warten...";

    try {
        await fragenLaden(katalog);

        if (index >= alleFragen.length) {
            errorMsg.innerText = "Diese Stations-Nummer existiert in diesem Katalog nicht.";
            
            document.getElementById("fragen-frage").value = "";
            document.getElementById("fragen-antwort").value = "";
            document.getElementById("fragen-nummer").value = "";
            document.getElementById("fragen-katalog").value = "";
            return;
        }

        document.getElementById("fragen-frage").value = alleFragen[index].frage;
        document.getElementById("fragen-antwort").value = alleFragen[index].antwort;
        document.getElementById("fragen-nummer").value = index +1;
        document.getElementById("fragen-katalog").value = katalog;
        errorMsg.innerText = "";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Laden der Fragen aus der Datenbank.";
    } finally {
        fragenLadenBtn.disabled = false;
        fragenLadenBtn.innerText = "Laden";
    }
});

document.getElementById("fragen-save-btn").addEventListener("click", async () => {
    const frageInput = document.getElementById("fragen-frage").value;
    const antwortInput = document.getElementById("fragen-antwort").value;
    const indexInput = document.getElementById("fragen-nummer").value -1;
    const katalogInput = document.getElementById("fragen-katalog").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    if (!frageInput || !antwortInput || !indexInput) {
        errorMsg.innerText = "Bitte Frage, Antwort und Index angeben!";
        return;
    }

    const fragenSaveBtn = document.getElementById("fragen-save-btn");
    fragenSaveBtn.disabled = true;
    fragenSaveBtn.innerText = "Bitte warten...";

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
    } finally {
        if (fragenSaveBtn) {
            fragenSaveBtn.disabled = false;
            fragenSaveBtn.innerText = "Speichern";
        }
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

    const fragenDeleteBtn = document.getElementById("fragen-delete-btn");
    fragenDeleteBtn.disabled = true;
    fragenDeleteBtn.innerText = "Bitte warten";

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
    } finally {
        if (fragenDeleteBtn) {
            fragenDeleteBtn.disabled = true;
            fragenDeleteBtn.innerText = "Bitte warten";
        }
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