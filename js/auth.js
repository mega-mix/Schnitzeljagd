import { FirebaseService } from "./classes/FirebaseService.js";

const fb = new FirebaseService();

// ---------------------------------------------
// --- LOGIN LOGIK ---
// ---------------------------------------------
document.getElementById("loginBtn").addEventListener("click", login);

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
        await fb.loginGruppe(nameInput, passInput);

        window.location.href = "game.html";
        
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Fehler beim Login.";
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