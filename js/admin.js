import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleFragen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";
let alleSpieler = [];





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGIN ABWARTEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
let authInitialisiert = false;

fb.onAuthChanged(async (user) => {
    // Sicherheit wenn Ident durch ist und noch kein Nutzer da ist
    if (authInitialisiert && !user) {
        window.location.href = "index.html";
        return;
    }
    
    authInitialisiert = true;

    // Daten von Spieler laden
    if (user) {
        spielerUid = user.uid;

        // Datenbank Zugriff
        try {
            spielerInfo = await fb.getSpielerInfo(spielerUid);
            if (spielerInfo) {
                if (spielerInfo.spielerName === "admin") {
                    document.getElementById("admin-bereich").style.display = "block";
                    ladeSpielstatus();
                }
            }
        } catch (error) {
            console.error("Fehler bei der Auth-Initialisierung:", error);
        }
    } else {
        // Nicht eingeloggt? Rauswurf zurück zur Loginseite!
        window.location.href = "index.html";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
async function ladeSpielstatus() {
    // Datenbank Spielstatus abrufen
    spielStatus = await fb.getSpielStatus();

    // Admin Nachricht anzeigen
    document.getElementById("admin-nachricht-display").innerText = spielStatus.adminNachricht;
    if (spielStatus.adminNachricht !== "") {
        document.getElementById("admin-nachricht-display").style.display = "block";
    } else {
        document.getElementById("admin-nachricht-display").style.display = "none";
    }

    // Spielfreigabe auswerten und anzeigen
    const status = document.getElementById("admin-status");
    if (spielStatus.freigegeben) {
        document.getElementById("admin-freigabe-btn").innerText = "Spiel pausieren";
    } else {
        document.getElementById("admin-freigabe-btn").innerText = "Spiel freigeben";
    }
    if (spielStatus.freigegeben) {
        status.innerText ="Spiel aktiv";
        status.style.color = "#2ECC71";
    } else {
        status.innerText ="Spiel pausiert";
        status.style.color = "#E74C3C";
    }

    // Tpppfreigabe auswerten und anzeigen
    const statusTipp = document.getElementById("admin-status-tipp");
    if (spielStatus.tipps) {
        document.getElementById("admin-tipp-btn").innerText = "Tipps sperren";
    } else {
        document.getElementById("admin-tipp-btn").innerText = "Tipps freigeben";
    }
    if (spielStatus.tipps) {
        statusTipp.innerText ="Tipps aktiv";
        statusTipp.style.color = "#2ECC71";
    } else {
        statusTipp.innerText ="Tipps gesperrt";
        statusTipp.style.color = "#E74C3C";
    }
}

document.getElementById("admin-fragen-btn").addEventListener("click", async () => {
    // Fragen von Datenbank laden
    await fragenLaden(1);

    // Dropdown Station füllen
    const dropdownStation = document.getElementById("fragen-station-laden");
    dropdownStation.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownStation.appendChild(opt);
    });
    dropdownStation.value = 0;

    // Dropdown Episoden füllen
    const dropdownEpisode = document.getElementById("fragen-episode-laden");
    dropdownEpisode.innerHTML = "";
    for (let i = 1; i <= spielStatus.episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i);
        dropdownEpisode.appendChild(opt);
    };
    dropdownEpisode.value = 1;

    // Bereiche umschalten
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-fragen-bereich").style.display = "block";
});

document.getElementById("admin-nachricht-btn").addEventListener("click", async () => {
    // Admin Nachricht aus Datenbank laden
    document.getElementById("admin-nachricht").value = await fb.getAdminNachricht();

    // Bereiche umschalten
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-nachricht-bereich").style.display = "block";
});

document.getElementById("admin-news-btn").addEventListener("click", async () => {
    // News aus Datenbank laden
    document.getElementById("admin-news").value = await fb.getAdminNews();

    // Bereiche umschalten
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-news-bereich").style.display = "block";
});

document.getElementById("admin-freigabe-btn").addEventListener("click", async () => {
    // Spielfreigabe toggeln
    await fb.setzeSpielStatus(!spielStatus.freigegeben);
    ladeSpielstatus();
});

document.getElementById("admin-tipp-btn").addEventListener("click", async () => {
    // Tippfreigabe toggeln
    await fb.setzeTippStatus(!spielStatus.tipps);
    ladeSpielstatus();
});

document.getElementById("admin-spieler-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("spieler-bereich").style.display = "block";
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- SPIELER BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("spieler-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("spieler-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("spieler-lastlogin-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("spieler-bereich").style.display = "none";
    document.getElementById("spieler-lastlogin-bereich").style.display = "block";
});

document.getElementById("spieler-bearbeiten-btn").addEventListener("click", async () => {
    // Alle Spieler von Datenbank laden
    alleSpieler = await fb.getAllDocuments("spieler");

    // Dropdown mit Daten füllen
    const dropdownSpieler = document.getElementById("spieler-bearbeiten-name");
    dropdownSpieler.innerHTML = "";
    alleSpieler.forEach((spieler) => {
        if (spieler.spielerName === "admin") return;
        const sp = document.createElement("option");
        sp.value = spieler.spielerName;
        sp.textContent = spieler.spielerName;
        dropdownSpieler.appendChild(sp);
    });

    // Bereiche umschalten
    document.getElementById("spieler-bereich").style.display = "none";
    document.getElementById("spieler-bearbeiten-bereich").style.display = "block";
});

document.getElementById("spieler-fortschritt-btn").addEventListener("click", async () => {
    // Lade Spielerfortschritt von Datenbank und in Tabelle anzeigen
    await ladeFortschritt();

    // Bereiche umschalten
    document.getElementById("spieler-bereich").style.display = "none";
    document.getElementById("spieler-fortschritt-bereich").style.display = "block";
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- SPIELER FORTSCHRITT --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("spieler-fortschritt-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("spieler-fortschritt-bereich").style.display = "none";
    document.getElementById("spieler-bereich").style.display = "block";
});

document.getElementById("spieler-fortschritt-refresh-btn").addEventListener("click", async () => {
    // Spielerfortschritt von Datenbank laden und in Tabelle anzeigen
    ladeFortschritt();
});

async function ladeFortschritt() {
    // Tabelle vorbereiten
    const tabelleBody = document.getElementById("spieler-fortschritt-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    // Daten aus Datenbank laden
    try {
        // Alle Spieler aus Datenbank laden
        alleSpieler = await fb.getAllDocuments("spieler");

        // Tabellenvariable leeren
        let htmlInhalt = "";

        alleSpieler.forEach((spieler) => {
            // Alle Spieler, außer Admin
            if (spieler.spielerName && spieler.spielerName.toLowerCase() !== "admin") {
                let uhrzeit = "--.--., --:--:--"

                const episode = spieler.episoden[spieler.aktiveEpisode];

                // Zeitstempel formatieren
                if (episode.zeitstempel) {
                    uhrzeit = new Date(episode.zeitstempel).toLocaleTimeString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                }
                
                // Tabelle generieren
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${spieler.spielerName}</td>
                        <td style="padding: 8px;">${spieler.aktiveEpisode}</td>
                        <td style="padding: 8px;">${episode.station}</td>
                        <td style="padding: 8px;">${episode.antworten.length}</td>
                        <td style="padding: 8px;">${episode.tipps.length}</td>
                        <td style="padding: 8px;">${uhrzeit}</td>
                    </tr>
                `;
            }
        });

        // Tabelle füllen
        tabelleBody.innerHTML = htmlInhalt || "<tr><td colspan='2' style='padding:8px;'>Kein Spieler gefunden.</td></tr>";
    } catch (error) {
        console.error(error);
        tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px; color:red;'>Fehler beim Abrufen der Spieler.</td></tr>";
    }
}





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- SPIELER LASTLOGIN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("spieler-lastlogin-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("spieler-lastlogin-bereich").style.display = "none";
    document.getElementById("spieler-bereich").style.display = "block";
});

document.getElementById("spieler-lastlogin-btn").addEventListener("click", async () => {
    // Tabelle laden
    const tabelleBody = document.getElementById("spieler-lastlogin-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    try {
        // Alle Spieler von Datenbank laden
        alleSpieler = await fb.getAllDocuments("spieler");

        // Tabellenvariable leeren
        let htmlInhalt = "";

        alleSpieler.forEach((spieler) => {
            if (spieler.spielerName) {
                let lastLogin = "--.--.--, --:--:--"
                
                // Zeitstempel formatieren
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
                
                // Tabelle generieren
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${spieler.spielerName}</td> 
                        <td style="padding: 8px;">${lastLogin}</td>
                    </tr>
                `;
            }
        });

        // Tabelle füllen
        tabelleBody.innerHTML = htmlInhalt || "<tr><td colspan='2' style='padding:8px;'>Keine Spieler gefunden.</td></tr>";
    } catch (error) {
        console.error(error);
        tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px; color:red;'>Fehler beim Abrufen der Spieler.</td></tr>";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- SPIELER BEARBEITEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("spieler-bearbeiten-abort-btn").addEventListener("click", () => {
    // Error Msg leeren
    document.getElementById("spieler-bearbeiten-error-msg").innerText = "";

    // Bereiche umschalten
    document.getElementById("spieler-bearbeiten-bereich").style.display = "none";
    document.getElementById("spieler-bereich").style.display = "block";
});

document.getElementById("spieler-bearbeiten-laden-btn").addEventListener("click", async () => {
    // Spieler Index aus Dropdown holen
    const dropdownSpieler = document.getElementById("spieler-bearbeiten-name");
    const auswahlIndex = alleSpieler.findIndex(spieler => spieler.spielerName === dropdownSpieler.value);

    // Fragen des ausgewählten Spielers laden
    await fragenLaden(alleSpieler[auswahlIndex].aktiveEpisode);

    // Dropdown für Station füllen
    const dropdownStation = document.getElementById("spieler-bearbeiten-station");
    dropdownStation.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownStation.appendChild(opt);
    });

    // Dropdown für Episoden füllen
    const dropdownAktiveEpisode = document.getElementById("spieler-bearbeiten-aktive-episode");
    dropdownAktiveEpisode.innerHTML = "";
    for (let i = 1; i <= spielStatus.episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i);
        dropdownAktiveEpisode.appendChild(opt);
    };

    // Dropdown für Episode auf Spieler einstellen
    const auswahlSpieler = alleSpieler[auswahlIndex];
    const spielerEpisode = auswahlSpieler.episoden[auswahlSpieler.aktiveEpisode];
    dropdownFrage.value = String(spielerEpisode.station -1);
    dropdownAktiveEpisode.value = String(auswahlSpieler.aktiveEpisode);
});

document.getElementById("spieler-bearbeiten-aktive-episode").addEventListener("change", async (event) => {
    const auswahlAktiveEpisode = event.target.value;

    await fragenLaden(auswahlAktiveEpisode);

    const dropdownStation = document.getElementById("spieler-bearbeiten-station");
    dropdownStation.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownStation.appendChild(opt);
    });
});

document.getElementById("spieler-bearbeiten-save-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("spieler-bearbeiten-name").value.trim();
    const stationInput = parseInt(document.getElementById("spieler-bearbeiten-station").value)+1;
    const aktiveEpisodeInput = parseInt(document.getElementById("spieler-bearbeiten-aktive-episode").value);
    const antwortReset = document.getElementById("spieler-bearbeiten-antwort-reset").checked;
    const tippReset = document.getElementById("spieler-bearbeiten-tipp-reset").checked;
    const errorMsg = document.getElementById("spieler-bearbeiten-error-msg");

    if (isNaN(stationInput) || isNaN(aktiveEpisodeInput)) {
        errorMsg.innerText = "Bitte alle Felder ausfüllen.";
        return;
    } else {
        const bearbeitenSaveBtn = document.getElementById("spieler-bearbeiten-save-btn");
        bearbeitenSaveBtn.disabled = true;
        bearbeitenSaveBtn.innerText = "Bitte warten...";

        try {
            alleSpieler = await fb.getAllDocuments("spieler");
            const gefundeneSpieler = alleSpieler.find(s => s.spielerName === nameInput);

            const episoden = gefundeneSpieler.episoden;

            episoden[aktiveEpisodeInput].station = stationInput;
            if (antwortReset) episoden[aktiveEpisodeInput].antworten = [];
            if (tippReset) episoden[aktiveEpisodeInput].tipps = [];
            episoden[aktiveEpisodeInput].zeitstempel = Date.now();
            
            if (gefundeneSpieler) {
                if (stationInput >= 1) {
                    await fb.updateDocument("spieler", gefundeneSpieler.id, {
                        aktiveEpisode: aktiveEpisodeInput,
                        episoden: episoden
                    });
                }

                document.getElementById("spieler-bearbeiten-name").value = "";
                document.getElementById("spieler-bearbeiten-station").value = "";
                document.getElementById("spieler-bearbeiten-aktive-episode").value = "";
                document.getElementById("spieler-bearbeiten-antwort-reset").checked = false;
                document.getElementById("spieler-bearbeiten-tipp-reset").checked = false;
                errorMsg.innerText = "";
                document.getElementById("spieler-bearbeiten-bereich").style.display = "none";
                document.getElementById("spieler-bereich").style.display = "block";

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





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN NACHRICHT BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
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
        ladeSpielstatus();

        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der Daten.";
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN NEWS BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("news-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-news-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("news-save-btn").addEventListener("click", async () => {
    const nachrichtInput = document.getElementById("admin-news").value.trim();
    const errorMsg = document.getElementById("news-error-msg");

    const nachrichtSaveBtn = document.getElementById("news-save-btn");
    nachrichtSaveBtn.disabled = true;
    nachrichtSaveBtn.innerText = "Bitte warten";

    try {
        await fb.setzeAdminNews(nachrichtInput);

        errorMsg.innerText = "";
        document.getElementById("admin-news-bereich").style.display = "none";
        document.getElementById("admin-bereich").style.display = "block";
        ladeSpielstatus();

        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der News.";
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- FRAGEN BEARBEITEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("fragen-abort-btn").addEventListener("click", () => {
    document.getElementById("admin-fragen-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
    document.getElementById("fragen-frage").value = "";
    document.getElementById("fragen-antwort").value = "";
    document.getElementById("fragen-nummer").value = "";
    document.getElementById("fragen-error-msg").innerText = "";
    document.getElementById("fragen-station-laden").value = 0;
});

document.getElementById("fragen-laden-btn").addEventListener("click", async () => {
    const index = document.getElementById("fragen-station-laden").value;
    const episode = document.getElementById("fragen-episode-laden").value;
    const errorMsg = document.getElementById("fragen-error-msg");

    const fragenLadenBtn = document.getElementById("fragen-laden-btn");
    fragenLadenBtn.disabled = true;
    fragenLadenBtn.innerText = "Bitte warten...";

    try {
        await fragenLaden(episode);

        if (index >= alleFragen.length) {
            errorMsg.innerText = "Diese Stations-Nummer existiert in dieser Episode nicht.";
            
            document.getElementById("fragen-frage").value = "";
            document.getElementById("fragen-antwort").value = "";
            document.getElementById("fragen-nummer").value = "";
            document.getElementById("fragen-episode").value = "";
            return;
        }

        document.getElementById("fragen-frage").value = alleFragen[index].frage;
        document.getElementById("fragen-antwort").value = alleFragen[index].antwort;
        document.getElementById("fragen-nummer").value = parseFloat(index) +1;
        document.getElementById("fragen-episode").value = episode;
        errorMsg.innerText = "";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Laden der Fragen aus der Datenbank.";
    } finally {
        fragenLadenBtn.disabled = false;
        fragenLadenBtn.innerText = "Laden";
    }
});

document.getElementById("fragen-episode-laden").addEventListener("change", async (event) => {
    const dropdownFrage = document.getElementById("fragen-station-laden");

    const auswahlEpisode = event.target.value;

    await fragenLaden(auswahlEpisode);

    dropdownFrage.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownFrage.appendChild(opt);
    });
});

document.getElementById("fragen-save-btn").addEventListener("click", async () => {
    const frageInput = document.getElementById("fragen-frage").value;
    const antwortInput = document.getElementById("fragen-antwort").value;
    const indexInput = document.getElementById("fragen-nummer").value;
    const episodeInput = document.getElementById("fragen-episode").value;
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

    const episodePath = "episode" + episodeInput;

    try {
        const checkExists = await fb.getDocument(episodePath, indexInput.toString());
        if (checkExists !== null) {
            await fb.updateDocument(episodePath, indexInput.toString(), neueFrage);
        } else {
            await fb.createDocument(episodePath, indexInput.toString(), neueFrage);
        }

        errorMsg.innerText = "";
    } catch (error) {
        console.error("Daten werden nicht gespeichert:", error);
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
    const episodeInput = document.getElementById("fragen-episode").value;
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

    const episodePath = "fragen" + episodeInput;

    try {
        const checkExists = await fb.getDocument(episodePath, indexInput.toString());

        if (checkExists !== null) {
            await fb.deleteDocument(episodePath, indexInput.toString());
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
            fragenDeleteBtn.disabled = false;
            fragenDeleteBtn.innerText = "Bitte warten";
        }
    }
});

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





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGOUT BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        await fb.auth.signOut();
        window.location.href = "index.html";
    } catch (error) {
        console.error("Fehler beim Logout:", error);
    }
});