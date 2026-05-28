import { Fragenkatalog } from "./classes/Fragenkatalog.js";
import { FirebaseService } from "./classes/FirebaseService.js";


// Instanzen der Services erstellen
const fb = new FirebaseService();
const katalog = new Fragenkatalog();

let aktuelleGruppe = "";
let aktuellerFortschritt = 0;
let alleFragen = [];


// ---------------------------------------------
// --- LOGIN LOGIK ---
// ---------------------------------------------
document.getElementById("loginBtn").addEventListener("click", await login);
document.getElementById("gruppenName").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        //event.preventDefault(); // Verhindert das standardmäßige Neuladen der Seite
        login();
    }
});
document.getElementById("passwort").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        //event.preventDefault(); // Verhindert das standardmäßige Neuladen der Seite
        login();
    }
});

async function login() {
    const nameInput = document.getElementById("gruppenName").value.trim();
    const passInput = document.getElementById("passwort").value;
    const errorMsg = document.getElementById("errorMsg");

    // Leere Felder prüfen
    if (!nameInput || !passInput) {
        errorMsg.innerText = "Bitte alles ausfüllen.";
        return;
    }

    // Login
    try {
        const uid = await fb.loginGruppe(nameInput, passInput);
        const daten = await fb.getDocument("gruppen", uid);

        aktuelleGruppe = daten.gruppenName;
        aktuellerFortschritt = daten.fortschritt || 0;
        const freigegeben = await fb.istSpielFreigegeben();

        if (aktuelleGruppe === "admin") {
            document.getElementById("loginBereich").style.display = "none";
            document.getElementById("adminBereich").style.display = "block";
            ladeAlleGruppen();
            return;
        }

        document.getElementById("loginBereich").style.display = "none";
        document.getElementById("spielBereich").style.display = "block";
        document.getElementById("begruessung").innerText = `Hallo ${aktuelleGruppe}`;


        zeigeFrage();
        
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Laden der Daten.";
    }
}

// ---------------------------------------------
// --- CREATE LOGIK ---
// ---------------------------------------------
document.getElementById("gotoCreateBtn").addEventListener("click", async () => {
    document.getElementById("loginBereich").style.display = "none";
    document.getElementById("createBereich").style.display = "block";
    document.getElementById("createGruppenName").focus();
});

document.getElementById("createAbortBtn").addEventListener("click", async () => {
    document.getElementById("createGruppenName").value = "";
    document.getElementById("createPasswort1").value = "";
    document.getElementById("createPasswort2").value = "";
    document.getElementById("createErrorMsg").innerText = "";
    document.getElementById("createBereich").style.display = "none";
    document.getElementById("loginBereich").style.display = "block";
});

document.getElementById("createBtn").addEventListener("click", async () => {
    const nameInput = document.getElementById("createGruppenName").value.trim();
    const passInput1 = document.getElementById("createPasswort1").value;
    const passInput2 = document.getElementById("createPasswort2").value;
    const errorMsg = document.getElementById("createErrorMsg");

    // Leere Felder prüfen
    if (!nameInput || !passInput1 || !passInput2) {
        errorMsg.innerText = "Bitte alles ausfüllen.";
        return;
    }

    // Passwort prüfen
    if (passInput1 !== passInput2) {
        errorMsg.innerText = "Passwort nicht gleich!";
        return;
    }
    if (passInput1.length < 6) {
        errorMsg.innerText = "Passwort muss mindestens 6 Zeichen lang sein.";
        return;
    }

    try {
        await fb.registriereGruppe(nameInput, passInput1);
        
        document.getElementById("gruppenName").value = nameInput;
        document.getElementById("createGruppenName").value = "";
        document.getElementById("createPasswort1").value = "";
        document.getElementById("createPasswort2").value = "";
        errorMsg.innerText = "";
        document.getElementById("createBereich").style.display = "none";
        document.getElementById("loginBereich").style.display = "block";
        document.getElementById("passwort").focus();
    } catch (error) {
        console.error(error);
        if (error.code === "auth/email-already-in-use") {
            errorMsg.innerText = "Dieser Gruppenname ist schon vergeben.";
        } else {
            errorMsg.innerText = "Fehler bei der Registrierung.";
        }
    }
});


// ---------------------------------------------
// --- ADMIN LOGIK ---
// ---------------------------------------------
async function ladeAlleGruppen() {
    const tabelleBody = document.getElementById("adminTabelleBody");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    document.getElementById("adminMengeStationen").innerText = `Es gibt ${katalog.anzahlFragen} Stationen`;
    alleFragen = await fb.getAllDocuments("fragen");

    const adminNachricht = await fb.getAdminNachricht();

    if (adminNachricht !== "") {
        document.getElementById("adminNachrichtDisplay").style.display = "block";
        document.getElementById("adminNachrichtDisplay").innerText = adminNachricht;
    } else {
        document.getElementById("adminNachrichtDisplay").style.display = "none";
    }

    const freigegeben = await fb.istSpielFreigegeben();

    if (freigegeben) {
        document.getElementById("adminPauseBtn").style.display = "block";
        document.getElementById("adminFreigabeBtn").style.display = "none";
    } else {
        document.getElementById("adminPauseBtn").style.display = "none";
        document.getElementById("adminFreigabeBtn").style.display = "block";
    }

    const status = document.getElementById("adminStatus");

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

document.getElementById("refreshAdminBtn").addEventListener("click", ladeAlleGruppen);

document.getElementById("adminGrpBearbeitenBtn").addEventListener("click", () => {
    document.getElementById("adminBereich").style.display = "none";
    document.getElementById("bearbeitenBereich").style.display = "block";
});

document.getElementById("adminFragenBearbeitenBtn").addEventListener("click", () => {
    document.getElementById("adminBereich").style.display = "none";
    document.getElementById("adminFragenBereich").style.display = "block";
});

document.getElementById("adminNachrichtBtn").addEventListener("click", async () => {
    document.getElementById("adminNachricht").value = await fb.getAdminNachricht();
    document.getElementById("adminBereich").style.display = "none";
    document.getElementById("adminNachrichtBereich").style.display = "block";
});

document.getElementById("adminPauseBtn").addEventListener("click", async () => {
    await fb.setzeSpielStatus(false);
    ladeAlleGruppen();
});

document.getElementById("adminFreigabeBtn").addEventListener("click", async () => {
    await fb.setzeSpielStatus(true);
    ladeAlleGruppen();
});


// ---------------------------------------------
// --- GRUPPE BEARBEITEN ---
// ---------------------------------------------
document.getElementById("bearbeitenAbortBtn").addEventListener("click", () => {
    document.getElementById("bearbeitenBereich").style.display = "none";
    document.getElementById("adminBereich").style.display = "block";
});

document.getElementById("bearbeitenDeleteBtn").addEventListener("click", async () => {
    const nameInput = document.getElementById("bearbeitenGruppenName").value.trim();
    const errorMsg = document.getElementById("bearbeitenErrorMsg");

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
    document.getElementById("bearbeitenBereich").style.display = "none";
    document.getElementById("adminBereich").style.display = "block";
});

document.getElementById("bearbeitenSaveBtn").addEventListener("click", async () => {
    const nameInput = document.getElementById("bearbeitenGruppenName").value.trim();
    const stationInput = parseInt(document.getElementById("bearbeitenFortschritt").value);
    const errorMsg = document.getElementById("bearbeitenErrorMsg");

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

    document.getElementById("bearbeitenGruppenName").value = "";
    document.getElementById("bearbeitenFortschritt").value = "";
    errorMsg.innerText = "";
    document.getElementById("bearbeitenBereich").style.display = "none";
    document.getElementById("adminBereich").style.display = "block";
    ladeAlleGruppen();
});


// ---------------------------------------------
// --- ADMIN NACHRICHT BEREICH ---
// ---------------------------------------------
document.getElementById("nachrichtAbortBtn").addEventListener("click", () => {
    document.getElementById("adminNachrichtBereich").style.display = "none";
    document.getElementById("adminBereich").style.display = "block";
});

document.getElementById("nachrichtSaveBtn").addEventListener("click", async () => {
    const nachrichtInput = document.getElementById("adminNachricht").value.trim();
    const errorMsg = document.getElementById("bearbeitenErrorMsg");

    try {
        fb.setzeAdminNachricht(nachrichtInput);

    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der Daten.";
    }

    errorMsg.innerText = "";
    document.getElementById("adminNachrichtBereich").style.display = "none";
    document.getElementById("adminBereich").style.display = "block";
    ladeAlleGruppen();
});


// ---------------------------------------------
// --- SPIEL LOGIK ---
// ---------------------------------------------
async function zeigeFrage() {
    const container = document.getElementById("frageContainer");
    const freigegeben = await fb.istSpielFreigegeben();
    const adminNachricht = await fb.getAdminNachricht();

    if (adminNachricht !== "") {
        document.getElementById("adminNachrichtDisplay").style.display = "block";
        document.getElementById("adminNachrichtDisplay").innerText = adminNachricht;
    } else {
        document.getElementById("adminNachrichtDisplay").style.display = "none";
    }

    alleFragen = await fb.getAllDocuments("fragen");

    if (!freigegeben) {
        container.innerHTML = `
            <p>Station ${aktuellerFortschritt +1}</p>
            <h3>Das Spiel ist aktuell pausiert.</h3>
            <p>Bitte warte auf die Freigabe von Björn.</p>
            <button id="statusBtn">Aktualisieren</button>
        `;
        document.getElementById("statusBtn").addEventListener("click", zeigeFrage);
    }
    else if (aktuellerFortschritt < katalog.anzahlFragen) {
        container.innerHTML = `
            <p>Station ${aktuellerFortschritt +1}</p>
            <p>${alleFragen[aktuellerFortschritt].frage}</p>
            <textarea id="antwortInput" placeholder="Eure Antwort"></textarea>
            <button id="antwortBtn">Antwort senden</button>
            <p id="spielFeedback" style="color:red;"></p>
        `;
        document.getElementById("antwortBtn").addEventListener("click", pruefeAntwort);
    }
    else {
        container.innerHTML = `<h3>Glückwunsch! Ihr habt den Tag mit Lea und Paul erfolgreich gemeistert! 🎉</h3>`;
    }
}

async function pruefeAntwort() {
    const spielerAntwort = document.getElementById("antwortInput").value;
    const feedback = document.getElementById("spielFeedback");
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


// ---------------------------------------------
// --- FRAGEN BEARBEITEN ---
// ---------------------------------------------
document.getElementById("fragenAbortBtn").addEventListener("click", () => {
    document.getElementById("adminFragenBereich").style.display = "none";
    document.getElementById("adminBereich").style.display = "block";
});

document.getElementById("fragenLadenBtn").addEventListener("click", () => {
    const index = document.getElementById("fragenNummerLaden").value;

    if (index >= alleFragen.length) return;

    document.getElementById("fragenFrage").value = alleFragen[index].frage;
    document.getElementById("fragenAntwort").value = alleFragen[index].antwort;
});

document.getElementById("fragenSaveBtn").addEventListener("click", () => {
    
});

document.getElementById("fragenDeleteBtn").addEventListener("click", () => {
    
});