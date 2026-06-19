import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;

let alleFragen = [];
let spielStatus = {};
let spielerInfo = {};
let spielerUid = "";
let alleSpieler = [];
let episodenAnzahl = 4;


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
                if (spielerInfo.spielerName === "admin") {
                    document.getElementById("admin-bereich").style.display = "block";
                    ladeAlleSpieler();
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


// ---------------------------------------------
// --- ADMIN LOGIK ---
// ---------------------------------------------
async function ladeAlleSpieler() {
    spielStatus = await fb.getDocument("spielStatus", "global");

    const tabelleBody = document.getElementById("admin-tabelle-body");
    tabelleBody.innerHTML = "<tr><td colspan='2' style='padding:8px;'>Lade Daten...</td></tr>";

    await fragenLaden(spielerInfo.aktiveEpisode);
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
        alleSpieler = await fb.getAllDocuments("spieler");
        let htmlInhalt = "";

        alleSpieler.forEach((spieler) => {
            if (spieler.spielerName && spieler.spielerName.toLowerCase() !== "admin") {
                let uhrzeit = "--.--., --:--:--"

                const indexEpisode = spieler.episoden.findIndex(ep => ep.name === spieler.aktiveEpisode);
                const episode = spieler.episoden[indexEpisode];

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
                
                htmlInhalt += `
                    <tr>
                        <td style="padding: 8px;">${spieler.spielerName}</td>
                        <td style="padding: 8px;">${spieler.aktiveEpisode}</td>
                        <td style="padding: 8px;">${episode.station}</td>
                        <td style="padding: 8px;">${episode.tipps}</td>
                        <td style="padding: 8px;">${episode.antworten}</td>
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

document.getElementById("admin-spieler-bearbeiten-btn").addEventListener("click", () => {
    const dropdown = document.getElementById("spieler-bearbeiten-name");
    dropdown.innerHTML = "";
    alleSpieler.forEach((spieler) => {
        if (spieler.spielerName === "admin") return;
        const sp = document.createElement("option");
        sp.value = spieler.spielerName;
        sp.textContent = spieler.spielerName;
        dropdown.appendChild(sp);
    });
    document.getElementById("admin-bereich").style.display = "none";
    document.getElementById("admin-spieler-bearbeiten-bereich").style.display = "block";
});

document.getElementById("admin-fragen-btn").addEventListener("click", () => {
    const dropdownFrage = document.getElementById("fragen-nummer-laden");
    dropdownFrage.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownFrage.appendChild(opt);
    });

    const dropdownEpisode = document.getElementById("fragen-episode-laden");
    dropdownEpisode.innerHTML = "";
    for (let i = 1; i <= episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i);
        dropdownEpisode.appendChild(opt);
    };

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
        alleSpieler = await fb.getAllDocuments("spieler");
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
document.getElementById("spieler-bearbeiten-abort-btn").addEventListener("click", () => {
    document.getElementById("spieler-bearbeiten-error-msg").innerText = "";
    document.getElementById("admin-spieler-bearbeiten-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});

document.getElementById("spieler-bearbeiten-laden").addEventListener("click", async () => {
    const dropdownSpieler = document.getElementById("spieler-bearbeiten-name");
    const dropdownFrage = document.getElementById("spieler-bearbeiten-station");
    const dropdownAktiveEpisode = document.getElementById("spieler-bearbeiten-aktive-episode");
    const antwortInput =document.getElementById("spieler-bearbeiten-antworten");
    const tippInput =document.getElementById("spieler-bearbeiten-tipp");

    const auswahlIndex = alleSpieler.findIndex(spieler => spieler.spielerName === dropdownSpieler.value);

    await fragenLaden(alleSpieler[auswahlIndex].aktiveEpisode);

    dropdownFrage.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownFrage.appendChild(opt);
    });

    dropdownAktiveEpisode.innerHTML = "";
    for (let i = 1; i <= episodenAnzahl; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Episode " + (i);
        dropdownAktiveEpisode.appendChild(opt);
    };

    const auswahlSpieler = alleSpieler[auswahlIndex];
    const indexEpisode = auswahlSpieler.episoden.findIndex(ep => ep.name === auswahlSpieler.aktiveEpisode);
    const spielerEpisode = auswahlSpieler.episoden[indexEpisode];

    dropdownFrage.value = String(spielerEpisode.station -1);
    dropdownAktiveEpisode.value = String(auswahlSpieler.aktiveEpisode);
    antwortInput.value = spielerEpisode.antworten;
    tippInput.value = spielerEpisode.tipps;
});

document.getElementById("spieler-bearbeiten-aktive-episode").addEventListener("change", async (event) => {
    const dropdownFrage = document.getElementById("spieler-bearbeiten-station");

    const auswahlAktiveEpisode = event.target.value;

    await fragenLaden(auswahlAktiveEpisode);

    dropdownFrage.innerHTML = "";
    alleFragen.forEach((frage, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Station " + (i+1);
        dropdownFrage.appendChild(opt);
    });
});

/*
document.getElementById("spieler-bearbeiten-delete-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("spieler-bearbeiten-name").value.trim();
    const errorMsg = document.getElementById("spieler-bearbeiten-error-msg");

    try {
        alleSpieler = await fb.getAllDocuments("spieler");
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
    document.getElementById("admin-spieler-bearbeiten-bereich").style.display = "none";
    document.getElementById("admin-bereich").style.display = "block";
});
*/

document.getElementById("spieler-bearbeiten-save-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("spieler-bearbeiten-name").value.trim();
    const stationInput = parseInt(document.getElementById("spieler-bearbeiten-station").value)+1;
    const aktiveEpisodeInput = parseInt(document.getElementById("spieler-bearbeiten-aktive-episode").value);
    const antwortenInput = parseInt(document.getElementById("spieler-bearbeiten-antworten").value);
    const tippInput = parseInt(document.getElementById("spieler-bearbeiten-tipp").value);
    const errorMsg = document.getElementById("spieler-bearbeiten-error-msg");

    if (isNaN(stationInput) || isNaN(aktiveEpisodeInput) || isNaN(antwortenInput) || isNaN(tippInput)) {
        errorMsg.innerText = "Bitte alle Felder ausfüllen.";
        return;
    } else {
        const bearbeitenSaveBtn = document.getElementById("spieler-bearbeiten-save-btn");
        bearbeitenSaveBtn.disabled = true;
        bearbeitenSaveBtn.innerText = "Bitte warten...";

        try {
            alleSpieler = await fb.getAllDocuments("spieler");
            const gefundeneSpieler = alleSpieler.find(s => s.spielerName === nameInput);

            const indexEpisode = gefundeneSpieler.episoden.findIndex(ep => ep.name === aktiveEpisodeInput);
            const episoden = gefundeneSpieler.episoden;

            episoden[indexEpisode].station = stationInput;
            episoden[indexEpisode].antworten = antwortenInput;
            episoden[indexEpisode].tipps = tippInput;
            episoden[indexEpisode].zeitstempel = Date.now();
            
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
                document.getElementById("spieler-bearbeiten-antworten").value = "";
                document.getElementById("spieler-bearbeiten-tipp").value = "";
                errorMsg.innerText = "";
                document.getElementById("admin-spieler-bearbeiten-bereich").style.display = "none";
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
    const index = document.getElementById("fragen-nummer-laden").value;
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
    const dropdownFrage = document.getElementById("fragen-nummer-laden");

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