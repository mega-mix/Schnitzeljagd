import { FirebaseService, APP_VERSION } from "./classes/FirebaseService.js";


const fb = new FirebaseService();

document.getElementById("version").innerText = APP_VERSION;





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- LOGIN LOGIK --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("login-btn").addEventListener("click", () => {
    // Login ausführen
    login();
});

document.getElementById("login-name").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        // Login ausführen
        login();
    }
});

document.getElementById("login-passwort").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        // Login ausführen
        login();
    }
});


async function login() {
    const nameInput = document.getElementById("login-name").value.trim();
    const passInput = document.getElementById("login-passwort").value;
    const errorMsg = document.getElementById("login-error-msg");

    // Leere Felder prüfen
    if (!nameInput || !passInput) {
        errorMsg.innerText = "Bitte alles ausfüllen.";
        return;
    }

    // Login Knopf sperren
    const loginBtn = document.getElementById("login-btn");
    loginBtn.disabled = true;
    loginBtn.innerText = "Bitte warten...";

    try {
        // Spieler in Datenbank anmelden
        await fb.loginSpieler(nameInput, passInput);

        // Startseite aufrufen
        window.location.href = "start.html";
        
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Login.";
    } finally {
        // Login Knopf freigeben
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerText = "Starten";
        }
    }
}





// *---------------------------------------------------------------------------------------------------------------------------------------
// *-------------------- CREATE LOGIK --------------------
// *---------------------------------------------------------------------------------------------------------------------------------------
document.getElementById("goto-create-btn").addEventListener("click", async () => {
    // Bereiche umschalten
    document.getElementById("login-bereich").style.display = "none";
    document.getElementById("create-bereich").style.display = "block";
    document.getElementById("create-name").focus();
});

document.getElementById("create-abort-btn").addEventListener("click", async () => {
    // GUI Felder leeren
    document.getElementById("create-name").value = "";
    document.getElementById("create-passwort").value = "";
    document.getElementById("create-passwort-wdh").value = "";
    document.getElementById("create-error-msg").innerText = "";

    // Bereiche umschalten
    document.getElementById("create-bereich").style.display = "none";
    document.getElementById("login-bereich").style.display = "block";
});

document.getElementById("create-btn").addEventListener("click", async () => {
    const erlaubteZeichen = /^[a-zA-Z0-9äöüÄÖÜß\-_]+$/;
    const nameInput = document.getElementById("create-name").value.trim();
    const passInput = document.getElementById("create-passwort").value;
    const passInputWdh = document.getElementById("create-passwort-wdh").value;
    const errorMsg = document.getElementById("create-error-msg");

    // Leere Felder prüfen
    if (!nameInput || !passInput || !passInputWdh) {
        errorMsg.innerText = "Bitte alles ausfüllen.";
        return;
    }

    // Sonderzeichen prüfen
    if (!erlaubteZeichen.test(nameInput)) {
        errorMsg.innerText = "Sonderzeichen (außer - und _) sind im Namen nicht erlaubt!";
        return;
    }

    // Passwort prüfen
    if (passInput !== passInputWdh) {
        errorMsg.innerText = "Passwort nicht gleich!";
        return;
    }
    if (passInput.length < 6) {
        errorMsg.innerText = "Passwort muss mindestens 6 Zeichen lang sein.";
        return;
    }

    // Erstellen Knopf sperren
    const createBtn = document.getElementById("create-btn");
    createBtn.disabled = true;
    createBtn.innerText = "Bitte warten...";

    try {
        // Spieler in Datenbank registrieren
        await fb.registriereSpieler(nameInput, passInput);
        
        // GUI Felder leeren
        document.getElementById("login-name").value = nameInput;
        document.getElementById("create-name").value = "";
        document.getElementById("create-passwort").value = "";
        document.getElementById("create-passwort-wdh").value = "";
        errorMsg.innerText = "";

        // Bereiche umschalten
        document.getElementById("create-bereich").style.display = "none";
        document.getElementById("login-bereich").style.display = "block";
        document.getElementById("login-passwort").focus();
    } catch (error) {
        console.error(error);

        // Fehler in GUI ausgeben
        if (error.code === "auth/email-already-in-use") {
            errorMsg.innerText = "Dieser Spielername ist schon vergeben.";
        } else {
            errorMsg.innerText = "Fehler bei der Registrierung.";
        }
    } finally {
        // Erstellen Knopf freigeben
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerText = "Erstellen";
        }
    }
});