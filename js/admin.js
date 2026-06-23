import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleStationen = [];
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

    // Tippfreigabe auswerten und anzeigen
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

document.getElementById("admin-episoden-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-episoden-bereich").style.display = "block";
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
                let uhrzeit = "--:--:--";
                let datum = "--.--.--";

                const episode = spieler.episoden[spieler.aktiveEpisode];

                // Zeitstempel formatieren
                if (episode.zeitstempel) {
                    uhrzeit = new Date(episode.zeitstempel).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                    datum = new Date(episode.zeitstempel).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit"
                    });
                }
                
                // Tabelle generieren
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;" class="zellen-text-limit" title="${spieler.spielerName}">${spieler.spielerName}</td>
                        <td style="padding: 8px;">${spieler.aktiveEpisode}</td>
                        <td style="padding: 8px;">${episode.station}</td>
                        <td style="padding: 8px;">${episode.antworten.length}</td>
                        <td style="padding: 8px;">${episode.tipps.length}</td>
                        <td style="padding: 8px;">${datum}<br>${uhrzeit}</td>
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
                let uhrzeit = "--:--:--";
                let datum = "--.--.--";
                
                // Zeitstempel formatieren
                if (spieler.lastLogin) {
                    uhrzeit = new Date(spieler.lastLogin).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
                    datum = new Date(spieler.lastLogin).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit"
                    });
                }
                
                // Tabelle generieren
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;" class="zellen-text-limit" title="${spieler.spielerName}">${spieler.spielerName}</td> 
                        <td style="padding: 8px;">${datum}<br>${uhrzeit}</td>
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

    // Stationen des ausgewählten Spielers laden
    await stationenLaden(alleSpieler[auswahlIndex].aktiveEpisode);

    // Dropdown für Station füllen
    const dropdownStation = document.getElementById("spieler-bearbeiten-station");
    dropdownStation.innerHTML = "";
    alleStationen.forEach((station, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i);
        dropdownStation.appendChild(opt);
    });

    // Dropdown für Episoden füllen
    const dropdownAktiveEpisode = document.getElementById("spieler-bearbeiten-aktive-episode");
    dropdownAktiveEpisode.innerHTML = "";
    const episodenAnzahl = Object.keys(spielStatus.episodenKatalog).length;
    for (let i = 1; i <= episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i);
        dropdownAktiveEpisode.appendChild(opt);
    };

    // Dropdown für Episode auf Spieler einstellen
    const auswahlSpieler = alleSpieler[auswahlIndex];
    const spielerEpisode = auswahlSpieler.episoden[auswahlSpieler.aktiveEpisode];
    dropdownStation.value = String(spielerEpisode.station);
    dropdownAktiveEpisode.value = String(auswahlSpieler.aktiveEpisode);
});

document.getElementById("spieler-bearbeiten-aktive-episode").addEventListener("change", async (event) => {
    const auswahlAktiveEpisode = event.target.value;

    // Stationen zur ausgewählten Episode laden
    await stationenLaden(auswahlAktiveEpisode);

    // Dropdown der Stationen füllen
    const dropdownStation = document.getElementById("spieler-bearbeiten-station");
    dropdownStation.innerHTML = "";
    alleStationen.forEach((station, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownStation.appendChild(opt);
    });
});

document.getElementById("spieler-bearbeiten-save-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("spieler-bearbeiten-name").value.trim();
    const stationInput = parseInt(document.getElementById("spieler-bearbeiten-station").value);
    const aktiveEpisodeInput = parseInt(document.getElementById("spieler-bearbeiten-aktive-episode").value);
    const antwortReset = document.getElementById("spieler-bearbeiten-antwort-reset").checked;
    const tippReset = document.getElementById("spieler-bearbeiten-tipp-reset").checked;
    const errorMsg = document.getElementById("spieler-bearbeiten-error-msg");

    // Prüfung auf Vollständigkeit
    if (isNaN(stationInput) || isNaN(aktiveEpisodeInput)) {
        //Abbruch bei Fehlern
        errorMsg.innerText = "Bitte alle Felder ausfüllen.";
        return;
    } else {
        // Speichern Knopf deaktivieren
        const bearbeitenSaveBtn = document.getElementById("spieler-bearbeiten-save-btn");
        bearbeitenSaveBtn.disabled = true;
        bearbeitenSaveBtn.innerText = "Bitte warten...";

        // Daten in Datenbank schreiben
        try {
            // Alle Spieler laden und markierten suchen
            alleSpieler = await fb.getAllDocuments("spieler");
            const gefundeneSpieler = alleSpieler.find(s => s.spielerName === nameInput);
            
            // Sicherheitsprüfung
            if (gefundeneSpieler) {
                if (stationInput >= 1) {
                    // Episode des Spielers holen
                    const episoden = gefundeneSpieler.episoden;

                    // Neue Werte übernehmen
                    episoden[aktiveEpisodeInput].station = stationInput;
                    if (antwortReset) episoden[aktiveEpisodeInput].antworten = [];
                    if (tippReset) episoden[aktiveEpisodeInput].tipps = [];
                    episoden[aktiveEpisodeInput].zeitstempel = Date.now();

                    // Daten in Datenbank schreiben
                    await fb.updateDocument("spieler", gefundeneSpieler.id, {
                        aktiveEpisode: aktiveEpisodeInput,
                        episoden: episoden
                    });
                }

                // GUI zurücksetzen
                document.getElementById("spieler-bearbeiten-name").value = "";
                document.getElementById("spieler-bearbeiten-station").value = "";
                document.getElementById("spieler-bearbeiten-aktive-episode").value = "";
                document.getElementById("spieler-bearbeiten-antwort-reset").checked = false;
                document.getElementById("spieler-bearbeiten-tipp-reset").checked = false;
                errorMsg.innerText = "";

                // Bereiche umschalten
                document.getElementById("spieler-bearbeiten-bereich").style.display = "none";
                document.getElementById("spieler-bereich").style.display = "block";

                // Speicher Knopf freigeben
                bearbeitenSaveBtn.disabled = false;
                bearbeitenSaveBtn.innerText = "Speichern";
            } else {
                // Fehler falls Spieler nicht geladen wurde
                errorMsg.innerText = "Spielername nicht gefunden.";
                return;
            }
        } catch (error) {
            console.error(error);
            errorMsg.innerText = "Fehler beim Speichern der Daten.";

            // Speicher Knopf freigeben
            bearbeitenSaveBtn.disabled = false;
            bearbeitenSaveBtn.innerText = "Speichern";
        }
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN NACHRICHT BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("nachricht-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("admin-nachricht-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("nachricht-save-btn").addEventListener("click", async () => {
    const nachrichtInput = document.getElementById("admin-nachricht").value.trim();
    const errorMsg = document.getElementById("nachrichten-error-msg");

    // Speicher Knopf sperren
    const nachrichtSaveBtn = document.getElementById("nachricht-save-btn");
    nachrichtSaveBtn.disabled = true;
    nachrichtSaveBtn.innerText = "Bitte warten";

    // Fehlermeldung zurücksetzen
    errorMsg.innerText = "";

    try {
        // Daten in Datenbank schreiben
        await fb.setzeAdminNachricht(nachrichtInput);
        
        // Bereiche umschalten
        document.getElementById("admin-nachricht-bereich").style.display = "none";
        document.getElementById("admin-bereich").style.display = "block";

        // Spielstatus aus Datenbank laden
        ladeSpielstatus();

        // Speicher Knopf freigeben
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der Daten.";

        // Speicher Knopf freigeben
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- ADMIN NEWS BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("news-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("admin-news-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("news-save-btn").addEventListener("click", async () => {
    const nachrichtInput = document.getElementById("admin-news").value.trim();
    const errorMsg = document.getElementById("news-error-msg");

    // Speicher Knopf sperren
    const nachrichtSaveBtn = document.getElementById("news-save-btn");
    nachrichtSaveBtn.disabled = true;
    nachrichtSaveBtn.innerText = "Bitte warten";

    // Fehlermeldung zurücksetzen
    errorMsg.innerText = "";

    try {
        // Speichern in Datenbank
        await fb.setzeAdminNews(nachrichtInput);
 
        // Bereiche umschalten
        document.getElementById("admin-news-bereich").style.display = "none";
        document.getElementById("admin-bereich").style.display = "block";

        // Spielstatus neu laden
        ladeSpielstatus();

        // Speicher Knopf freigeben
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Speichern der News.";

        // Speicherknopf freigeben
        nachrichtSaveBtn.disabled = false;
        nachrichtSaveBtn.innerText = "Speichern";
    }
});





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- EPISODEN BEREICH --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("episoden-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("admin-episoden-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
})

document.getElementById("episoden-station-btn").addEventListener("click", async () => {
    // Stationen von Datenbank laden
    await stationenLaden(1);

    // Dropdown Station füllen
    const dropdownStation = document.getElementById("station-station-laden");
    dropdownStation.innerHTML = "";
    alleStationen.forEach((station, i) => {
        const opt = document.createElement("option");
        opt.value = i+1;
        opt.textContent = "Station " + (i+1);
        dropdownStation.appendChild(opt);
    });
    dropdownStation.value = 1;

    // Dropdown Episoden-laden füllen
    const dropdownEpisodeLaden = document.getElementById("station-episode-laden");
    dropdownEpisodeLaden.innerHTML = "";
    const episodenAnzahl = Object.keys(spielStatus.episodenKatalog).length;
    for (let i = 1; i <= episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i) + " - " + spielStatus.episodenKatalog[i].titel;
        dropdownEpisodeLaden.appendChild(opt);
    };
    dropdownEpisodeLaden.value = 1;

    // Dropdown Episoden füllen
    const dropdownEpisode = document.getElementById("station-episode");
    dropdownEpisode.innerHTML = "";
    for (let i = 1; i <= episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i) + " - " + spielStatus.episodenKatalog[i].titel;
        dropdownEpisode.appendChild(opt);
    };
    dropdownEpisode.value = "";

    // Bereiche umschalten
    document.getElementById("admin-episoden-bereich").style.display = "none";
    document.getElementById("episoden-station-bereich").style.display = "block";
});

document.getElementById("episoden-episoden-btn").addEventListener("click", () => {
    // Dropdown Episoden füllen
    const dropdownEpisode = document.getElementById("episoden-episode-laden");
    dropdownEpisode.innerHTML = "";
    const episodenAnzahl = Object.keys(spielStatus.episodenKatalog).length;
    for (let i = 1; i <= (episodenAnzahl+1); i++) {
        const opt = document.createElement("option");
        opt.value = i;
        if (i <= episodenAnzahl) {
            opt.textContent = "Episode " + (i) + " - " + spielStatus.episodenKatalog[i].titel;
        } else {
            opt.textContent = "Episode " + (i) + " - NEU";
        }
        dropdownEpisode.appendChild(opt);
    };
    dropdownEpisode.value = "";

    // Bereiche umschalten
    document.getElementById("admin-episoden-bereich").style.display = "none";
    document.getElementById("episoden-episoden-bereich").style.display = "block";
})





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- STATION BEARBEITEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("station-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("episoden-station-bereich").style.display = "none";
    document.getElementById("admin-episoden-bereich").style.display = "block";

    // GUI Felder leeren
    document.getElementById("station-frage").value = "";
    document.getElementById("station-antwort").value = "";
    document.getElementById("station-tipp-1").value = "";
    document.getElementById("station-tipp-2").value = "";
    document.getElementById("station-tipp-3").value = "";
    document.getElementById("station-nummer").value = "";
    document.getElementById("station-error-msg").innerText = "";
    document.getElementById("station-station-laden").value = 0;
});

document.getElementById("station-laden-btn").addEventListener("click", async () => {
    const station = document.getElementById("station-station-laden").value;
    const episode = document.getElementById("station-episode-laden").value;
    const errorMsg = document.getElementById("station-error-msg");

    // Prüfen ob Station ausgewählt ist
    if (!station) return;

    // Laden Knopf sperren
    const stationenLadenBtn = document.getElementById("station-laden-btn");
    stationenLadenBtn.disabled = true;
    stationenLadenBtn.innerText = "Bitte warten...";

    try {
        // Stationen zur Episode laden
        await stationenLaden(episode);

        // Stationsnummer prüfen
        if (station > alleStationen.length) {
            // Weniger Stationen in Episode, als ausgewählte Station
            errorMsg.innerText = "Diese Stations-Nummer existiert in dieser Episode nicht.";
            
            // GUI Felder leeren
            document.getElementById("station-frage").value = "";
            document.getElementById("station-antwort").value = "";
            document.getElementById("station-tipp-1").value = "";
            document.getElementById("station-tipp-2").value = "";
            document.getElementById("station-tipp-3").value = "";
            document.getElementById("station-nummer").value = "";
            document.getElementById("station-episode").value = "";

            // Abbruch
            return;
        }

        // GUI Felder mit Daten füllen
        document.getElementById("station-frage").value = alleStationen[station-1].frage;
        document.getElementById("station-antwort").value = alleStationen[station-1].antwort;
        document.getElementById("station-tipp-1").value = alleStationen[station-1].tipp1;
        document.getElementById("station-tipp-2").value = alleStationen[station-1].tipp2;
        document.getElementById("station-tipp-3").value = alleStationen[station-1].tipp3;
        document.getElementById("station-nummer").value = parseFloat(station);
        document.getElementById("station-episode").value = episode;
        errorMsg.innerText = "";
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Laden der Stationen aus der Datenbank.";
    } finally {
        // Laden Knopf freigeben
        stationenLadenBtn.disabled = false;
        stationenLadenBtn.innerText = "Laden";
    }
});

document.getElementById("station-episode-laden").addEventListener("change", async (event) => {
    const auswahlEpisode = event.target.value;

    // Stationen aus Datenbank laden
    await stationenLaden(auswahlEpisode);

    // Dropdown Stationen füllen
    const dropdownStation = document.getElementById("station-station-laden");
    dropdownStation.innerHTML = "";
    alleStationen.forEach((station, i) => {
        const opt = document.createElement("option");
        opt.value = i+1;
        opt.textContent = "Station " + (i+1);
        dropdownStation.appendChild(opt);
    });
});

document.getElementById("station-save-btn").addEventListener("click", async () => {
    const frageInput = document.getElementById("station-frage").value;
    const antwortInput = document.getElementById("station-antwort").value;
    const tippInput1 = document.getElementById("station-tipp-1").value;
    const tippInput2 = document.getElementById("station-tipp-2").value;
    const tippInput3 = document.getElementById("station-tipp-3").value;
    const stationInput = document.getElementById("station-nummer").value;
    const episodeInput = document.getElementById("station-episode").value;
    const errorMsg = document.getElementById("station-error-msg");

    // Eingaben auf Vollständigkeit prüfen (Tipp optional)
    if (!frageInput || !antwortInput || !stationInput || !episodeInput) {
        errorMsg.innerText = "Bitte Frage, Antwort, Episode und Station angeben!";
        return;
    }

    // Eingabe auf Gültigkeit prüfen
    if (episodeInput <= 0 || stationInput <= 0) {
        errorMsg.innerText = "Station und Episode müssen größer 0 sein!";
        return;
    }

    // Speicher Knopf sperren
    const stationenSaveBtn = document.getElementById("station-save-btn");
    stationenSaveBtn.disabled = true;
    stationenSaveBtn.innerText = "Bitte warten...";

    // Fehlermeldung leeren
    errorMsg.innerText = "";

    // Objekt für Station erstellen
    const neueStation = {
        frage: frageInput,
        antwort: antwortInput,
        tipp1: tippInput1,
        tipp2: tippInput2,
        tipp3: tippInput3
    };

    // Dateiname Episode für Datenbank erstellen
    const episodePath = "episode" + episodeInput;

    try {
        // Prüfen ob die Station existiert
        const checkExists = await fb.getDocument(episodePath, stationInput.toString());
        if (checkExists !== null) {
            // Station existiert, update
            await fb.updateDocument(episodePath, stationInput.toString(), neueStation);
        } else {
            // Station existiert nicht, neu anlegen
            await fb.createDocument(episodePath, stationInput.toString(), neueStation);
        }
    } catch (error) {
        console.error("Daten werden nicht gespeichert:", error);
        errorMsg.innerText = "Fehler beim speichern der Daten.";
    } finally {
        // Speicher Knopf freigeben
        if (stationenSaveBtn) {
            stationenSaveBtn.disabled = false;
            stationenSaveBtn.innerText = "Speichern";
        }
    }
    
});

document.getElementById("station-delete-btn").addEventListener("click", async () => {
    const indexInput = document.getElementById("station-nummer").value;
    const episodeInput = document.getElementById("station-episode").value;
    const errorMsg = document.getElementById("station-error-msg");

    // Input prüfen
    if (!indexInput) {
        errorMsg.innerText = "Bitte Stationsnummer zum löschen angeben!";
        return;
    }

    // Löschen Knopf sperren
    const stationenDeleteBtn = document.getElementById("station-delete-btn");
    stationenDeleteBtn.disabled = true;
    stationenDeleteBtn.innerText = "Bitte warten";

    // Fehlermeldung leeren
    errorMsg.innerText = "";

    // Popup zur Bestätigung öffnen
    const entscheidung = confirm(`Möchten Sie die Station ${indexInput} wirklich löschen?`);
    if (!entscheidung) return;

    // Dateiname der Episode erstellen
    const episodePath = "episode" + episodeInput;

    try {
        // Prüfen ob Station existiert
        const checkExists = await fb.getDocument(episodePath, indexInput.toString());
        if (checkExists !== null) {
            // Station existiert, löschen
            await fb.deleteDocument(episodePath, indexInput.toString());
        } else {
            // Station existiert nicht, abbruch
            errorMsg.innerText = "Station existiert nicht!";
            return;
        }
    } catch (error) {
        console.error("Daten werden nicht gelöscht:", error);
        errorMsg.innerText = "Fehler beim löschen der Daten.";
    } finally {
        // Löschen Knopf freigeben
        if (stationenDeleteBtn) {
            stationenDeleteBtn.disabled = false;
            stationenDeleteBtn.innerText = "Löschen";
        }
    }
});

async function stationenLaden(episode) {
    try {
        // Dateiname Episode erstellen
        const episodePath = "episode" + episode;

        // Alle Stationen laden
        const geladeneStationen = await fb.getAllDocuments(episodePath);

        // Stationen in Array sortiern
        alleStationen = geladeneStationen.sort((a, b) => {
            return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
    } catch (error) {
        console.error("Fehler beim Laden der Stationen:", error);
    }
}





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- EPISODEN BEARBEITEN --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("episoden-bearbeiten-abort-btn").addEventListener("click", () => {
    // Bereiche umschalten
    document.getElementById("episoden-episoden-bereich").style.display = "none";
    document.getElementById("admin-episoden-bereich").style.display = "block";

    // GUI Felder leeren
    document.getElementById("episoden-bearbeiten-titel").value = "";
    document.getElementById("episoden-bearbeiten-aktiv").checked = false;
});

document.getElementById("episoden-episode-laden").addEventListener("change", async () => {
    const titelInput = document.getElementById("episoden-bearbeiten-titel");
    const aktivCheckbox = document.getElementById("episoden-bearbeiten-aktiv");
    const episodeKey = event.target.value;

    // Bei neuer Episode nicht laden
    const episodenAnzahl = Object.keys(spielStatus.episodenKatalog).length;
    if (episodeKey > episodenAnzahl) {
        titelInput.value = "";
        aktivCheckbox.checked = false;
        return;
    }

    // Episoden Infos von Datenbank laden
    try {
        // Episoden Info von Datenbank laden
        spielStatus = await fb.getSpielStatus();

        // GUI Felder füllen
        titelInput.value = spielStatus.episodenKatalog[episodeKey].titel;
        aktivCheckbox.checked = spielStatus.episodenKatalog[episodeKey].globalAktiv
    } catch (error) {
        console.error("Fehler beim Laden der Episoden-Informationen:", error);
    }
});

document.getElementById("episoden-bearbeiten-save-btn").addEventListener("click", async () => {
    const titelInput = document.getElementById("episoden-bearbeiten-titel").value;
    const aktivCheckbox = document.getElementById("episoden-bearbeiten-aktiv").checked;
    const episodeKey = document.getElementById("episoden-episode-laden").value;

    // Ohne Titel nicht speichern
    if (!titelInput) return;

    // Speichern Knopf sperren
    const bearbeitenSaveBtn = document.getElementById("episoden-bearbeiten-save-btn");
    bearbeitenSaveBtn.disabled = true;
    bearbeitenSaveBtn.innerText = "Bitte warten...";

    try {
        const episodePath = "episode" + episodeKey;

        // Prüfen ob neue Episode
        let episodenAnzahl = Object.keys(spielStatus.episodenKatalog).length;
        if (episodeKey > episodenAnzahl) {
            // Neu anlegen

            // Episoden Objekt erstellen
            const neueEpisode = {
                titel: titelInput,
                globalAktiv: aktivCheckbox
            };
            spielStatus.episodenKatalog[episodeKey] = neueEpisode;

            // Episodenzahl in Datenbank schreiben
            await fb.updateDocument("spielStatus", "global", {
                episodenKatalog: spielStatus.episodenKatalog
            });

            // Dropdown Episoden füllen
            const dropdownEpisode = document.getElementById("episoden-episode-laden");
            dropdownEpisode.innerHTML = "";
            episodenAnzahl = Object.keys(spielStatus.episodenKatalog).length;
            for (let i = 1; i <= (episodenAnzahl+1); i++) {
                const opt = document.createElement("option");
                opt.value = i;
                if (i <= episodenAnzahl) {
                    opt.textContent = "Episode " + (i) + " - " + spielStatus.episodenKatalog[i].titel;
                } else {
                    opt.textContent = "Episode " + (i) + " - NEU";
                }
                dropdownEpisode.appendChild(opt);
            };
            dropdownEpisode.value = "";

            // GUI Felder leeren
            document.getElementById("episoden-bearbeiten-titel").value = "";
            document.getElementById("episoden-bearbeiten-aktiv").checked = false;
        } else {
            // Episode updaten

            // Daten in Datenbank schreiben
            spielStatus.episodenKatalog[episodeKey].titel = titelInput;
            spielStatus.episodenKatalog[episodeKey].globalAktiv = aktivCheckbox;
            await fb.updateDocument("spielStatus", "global", {
                episodenKatalog: spielStatus.episodenKatalog
            });
        }
    } catch (error) {
        console.error("Fehler beim speichern der Episoden-Information:", error);
    } finally {
        bearbeitenSaveBtn.disabled = false;
        bearbeitenSaveBtn.innerText = "Speichern";
    }
});




// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGOUT BUTTON --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        // Benutzer an Datenbank abmelden
        await fb.auth.signOut();

        // Zurück zur Login Seite
        window.location.href = "index.html";
    } catch (error) {
        console.error("Fehler beim Logout:", error);
    }
});