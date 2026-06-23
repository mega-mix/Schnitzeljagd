import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, setDoc, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";


export const APP_VERSION ="v1.7.0";

export class FirebaseService {
    constructor() {
        // Firebase mit Konfiguration initialisieren
        const config = {
            apiKey: "AIzaSyCPbi2jtsc-_t4fWqqffG7J7UU3DGCZFbQ",
            authDomain: "schnitzeljagt-e313a.firebaseapp.com",
            projectId: "schnitzeljagt-e313a",
            storageBucket: "schnitzeljagt-e313a.firebasestorage.app",
            messagingSenderId: "1040239716577",
            appId: "1:1040239716577:web:c67ecce8b89451eb1f2fa0"
        };

        this.app = initializeApp(config);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
    }

    onAuthChanged(callback) {
        import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js").then(({ onAuthStateChanged }) => {
            onAuthStateChanged(this.auth, callback);
        });
    }

    /**
     * Helfer-Methode, um aus einem Spielernamen eine interne Fake-E-Mail zu bauen
     */
    _baueFakeEmail(name) {
        return `${name.trim().toLowerCase()}@schnitzeljagd.intern`;
    }

    /**
     * Registriert einen neuen Spieler im Auth-System und legt sofort 
     * das passende Spieler-Dokument in Firestore an (ID = UID).
     */
    async registriereSpieler(spielerName, passwort) {
        // Spielernamen überarbeiten
        const saubererName = spielerName.trim().replace(/[^a-zA-Z0-9 äöüÄÖÜß\-_]/g, "");
        const emailName = saubererName
            .toLowerCase()
            .replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue").replace(/ß/gi, "ss")

        // Email Adresse erstellen
        const fakeEmail = this._baueFakeEmail(emailName);

        // Episoden Objekt erstellen
        const episoden = {
            1: { aktiv: true, station: 1, antworten: [], tipps: [], zeitstempel: Date.now() },
            2: { aktiv: true, station: 1, antworten: [], tipps: [], zeitstempel: Date.now() }
        }
        
        // Im Auth-System registrieren
        const userCredential = await createUserWithEmailAndPassword(this.auth, fakeEmail, passwort);
        const uid = userCredential.user.uid;

        // Dokument in Datenbank anlegen
        const docRef = doc(this.db, "spieler", uid);
        await setDoc(docRef, {
            spielerName: saubererName.trim(),
            aktiveEpisode: 1,
            episoden: episoden
        });

        return uid;
    }

    /**
     * Loggt einen Spieler ein und gibt seine UID zurück
     */
    async loginSpieler(spielerName, passwort) {
        // Spielername überarbeiten
        const saubererName = spielerName.trim().replace(/[^a-zA-Z0-9 äöüÄÖÜß\-_]/g, "");
        const emailName = saubererName
            .toLowerCase()
            .replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue").replace(/ß/gi, "ss")

        // Email Adresse erstellen
        const fakeEmail = this._baueFakeEmail(emailName);

        // Spieler an Datenbank anmelden
        const userCredential = await signInWithEmailAndPassword(this.auth, fakeEmail, passwort);

        // Login Zeitstempel in Datenbank schreiben
        await this.updateDocument("spieler", userCredential.user.uid, { lastLogin: Date.now() });

        // UID zurückgeben
        return userCredential.user.uid;
    }

    /**
     * Holt den aktuellen Spielstatus von der Datenbank
     */
    async getSpielStatus() {
        // Spielstatus aus Datenbank laden
        const docRef = doc(this.db, "spielStatus", "global");
        const docSnap = await getDoc(docRef);
        
        // Daten zurückgeben
        if (docSnap.exists()) return docSnap.data();
        return null;
    }


    /**
     * Holt Spieler Informationen aus der Datenbank
     * @param {string} uid - User ID
     * @returns {Object|null} Die Daten des Spielers oder null, wenn er nicht existiert
     */
    async getSpielerInfo(uid) {
        // Spieler Info aus Datenbank laden
        const docRef = doc(this.db, "spieler", uid);
        const docSnap = await getDoc(docRef);
        
        // Daten zurückgeben
        if (docSnap.exists()) return docSnap.data();
        return null;
    }


    /**
     * Holt ein einzelnes Dokument aus einer Collection anhand der ID
     * @param {string} collectionName - Name der Collection (z.B. "spieler")
     * @param {string} docId - ID des Dokuments (z.B. Spielername)
     * @returns {Object|null} Die Daten des Dokuments oder null, wenn es nicht existiert
     */
    async getDocument(collectionName, docId) {
        // Dokument aus Datenbank laden
        const docRef = doc(this.db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        // Daten zurückgeben
        if (docSnap.exists()) return docSnap.data();
        return null;
    }

    /**
     * Aktualisiert bestimmte Felder in einem bestehenden Dokument
     * @param {string} collectionName - Name der Collection
     * @param {string} docId - ID des Dokuments
     * @param {Object} data - Die zu aktualisierenden Felder (z.B. { station: 2 })
     */
    async updateDocument(collectionName, docId, data) {
        // Dokument in Datenbank aktualisieren
        const docRef = doc(this.db, collectionName, docId);
        await updateDoc(docRef, data);
    }

    /**
     * Holt ALLE Dokumente aus einer bestimmten Collection
     * @param {string} collectionName - Name der Collection
     * @returns {Array} Ein Array aus Objekten, die die ID und die Daten enthalten
     */
    async getAllDocuments(collectionName) {
        // Ganze Sammlung aus Datenbank laden
        const querySnapshot = await getDocs(collection(this.db, collectionName));
        
        // Daten in Array schieben
        const dokumente = [];
        querySnapshot.forEach((doc) => {
            dokumente.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Daten zurückgeben
        return dokumente;
    }

    /**
     * Löscht ein bestimmtes Dokument aus einer Collection
     * @param {string} collectionName - Name der Collection (z.B. "spieler")
     * @param {string} docId - ID des zu löschenden Dokuments (z.B. Spielername)
     */
    async deleteDocument(collectionName, docId) {
        // Dokument aus Datenbank löschen
        const docRef = doc(this.db, collectionName, docId);
        await deleteDoc(docRef);
    }

    /**
     * Erstellt ein neues Dokument in einer Collection
     * @param {string} collectionName - Name der Collection (z.B. "spieler")
     * @param {string} docId - ID des zu erstellenden Dokuments (z.B. Spielername)
     * @param {string} daten - Daten für das neue Dokument
     */
    async createDocument(collectionName, docId, daten) {
        // Dokument in Datenbank anlegen
        const docRef = doc(this.db, collectionName, docId);
        await setDoc(docRef, daten);
    }

    /**
     * Holt den aktuellen globalen Spielstatus
     * @returns {Promise<boolean>} true wenn freigegeben, false wenn pausiert
     */
    async istSpielFreigegeben() {
        // Status der Spielfreigabe aus Datenbank abrufen
        const daten = await this.getDocument("spielStatus", "global");

        // Daten zurückgeben
        return daten ? daten.freigegeben : false; // Standardmäßig false, falls Dokument fehlt
    }

    /**
     * Schaltet den globalen Spielstatus um
     * @param {boolean} status - true für freigeben, false für pausieren
     */
    async setzeSpielStatus(status) {
        // Spielfreigabe in Datenbank schreiben
        await this.updateDocument("spielStatus", "global", { freigegeben: status });
    }

    /**
     * Holt den aktuellen Tipp Spielstatus
     * @returns {Promise<boolean>} true wenn freigegeben, false wenn deaktiviert
     */
    async istTippFreigegeben() {
        // Holt Freigabestatus in Datenbank ab
        const daten = await this.getDocument("spielStatus", "global");

        // Daten zurückgeben
        return daten ? daten.tipps : false; // Standardmäßig false, falls Dokument fehlt
    }

    /**
     * Schaltet den Tipp Spielstatus um
     * @param {boolean} status - true für freigeben, false für deaktiviert
     */
    async setzeTippStatus(status) {
        // Tippfreigabe in Datenbank schreiben
        await this.updateDocument("spielStatus", "global", { tipps: status });
    }

    /**
     * Setzt eine globale Admin Nachricht
     * @param {string} msg - Text der Nachricht
     */
    async setzeAdminNachricht(msg) {
        // Schreibt Daten in die Datenbank
        await this.updateDocument("spielStatus", "global", { adminNachricht: msg });
    }

    /**
     * Ruft globale Admin Nachricht ab
     * @returns {string} Text der Nachricht
     */
    async getAdminNachricht() {
        // Daten aus der Datenbank laden
        const daten = await this.getDocument("spielStatus", "global");

        // Daten zurückgeben
        return daten ? daten.adminNachricht : "";
    }

    /**
     * Setzt eine globale News Nachricht
     * @param {string} msg - Text der Nachricht
     */
    async setzeAdminNews(msg) {
        // Schreibt Daten in die Datenbank
        await this.updateDocument("spielStatus", "global", { news: msg });
    }

    /**
     * Ruft globale Admin News ab
     * @returns {string} Text der Nachricht
     */
    async getAdminNews() {
        // Daten aus der Datenbank laden
        const daten = await this.getDocument("spielStatus", "global");

        // Daten zurückgeben
        return daten ? daten.news : "";
    }
}