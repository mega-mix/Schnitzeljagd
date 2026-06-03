import { FirebaseService } from "./classes/FirebaseService.js";

const fb = new FirebaseService();

document.getElementById("version").innerText = "v 1.3.0";

// ---------------------------------------------
// --- LOGIN LOGIK ---
// ---------------------------------------------
document.getElementById("login-btn").addEventListener("click", login);

document.getElementById("login-name").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        login();
    }
});

document.getElementById("login-passwort").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        //event.preventDefault(); // Verhindert das standardmäßige Neuladen der Seite
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

    // Login
    try {
        await fb.loginGruppe(nameInput, passInput);

        window.location.href = "start.html";
        
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Login.";
    }
}


// ---------------------------------------------
// --- CREATE LOGIK ---
// ---------------------------------------------
document.getElementById("goto-create-btn").addEventListener("click", async () => {
    document.getElementById("login-bereich").style.display = "none";
    document.getElementById("create-bereich").style.display = "block";
    document.getElementById("create-name").focus();
});

document.getElementById("create-abort-btn").addEventListener("click", async () => {
    document.getElementById("create-name").value = "";
    document.getElementById("create-passwort").value = "";
    document.getElementById("create-passwort-wdh").value = "";
    document.getElementById("create-error-msg").innerText = "";
    document.getElementById("create-bereich").style.display = "none";
    document.getElementById("login-bereich").style.display = "block";
});

document.getElementById("create-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("create-name").value.trim();
    const passInput = document.getElementById("create-passwort").value;
    const passInputWdh = document.getElementById("create-passwort-wdh").value;
    const errorMsg = document.getElementById("create-error-msg");

    // Leere Felder prüfen
    if (!nameInput || !passInput || !passInputWdh) {
        errorMsg.innerText = "Bitte alles ausfüllen.";
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

    try {
        await fb.registriereGruppe(nameInput, passInput);
        
        document.getElementById("login-name").value = nameInput;
        document.getElementById("create-name").value = "";
        document.getElementById("create-passwort").value = "";
        document.getElementById("create-passwort-wdh").value = "";
        errorMsg.innerText = "";
        document.getElementById("create-bereich").style.display = "none";
        document.getElementById("login-bereich").style.display = "block";
        document.getElementById("login-passwort").focus();
    } catch (error) {
        console.error(error);
        if (error.code === "auth/email-already-in-use") {
            errorMsg.innerText = "Dieser Gruppenname ist schon vergeben.";
        } else {
            errorMsg.innerText = "Fehler bei der Registrierung.";
        }
    }
});