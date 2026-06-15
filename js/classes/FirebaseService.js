import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export const APP_VERSION ="v1.4.6";

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
     * Registriert einen neuen Spieler im Auth-System UND legt sofort 
     * das passende Fortschritts-Dokument in Firestore an (ID = UID).
     */
    async registriereSpieler(spielerName, passwort) {
        const saubererName = spielerName.trim().replace(/[^a-zA-Z0-9 äöüÄÖÜß\-_]/g, "");
        const emailName = saubererName
            .toLowerCase()
            .replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue").replace(/ß/gi, "ss")

        const fakeEmail = this._baueFakeEmail(emailName);
        
        // 1. Im Auth-System registrieren
        const userCredential = await createUserWithEmailAndPassword(this.auth, fakeEmail, passwort);
        const uid = userCredential.user.uid;

        // 2. Direkt das geschützte Dokument in Firestore anlegen
        const docRef = doc(this.db, "spieler", uid);
        await setDoc(docRef, {
            spielerName: saubererName.trim(),
            fortschritt: 0,
            katalog: 1,
            tipps: 0,
            antworten: 0
        });

        return uid;
    }

    /**
     * Loggt einen Spieler ein und gibt deren UID zurück
     */
    async loginSpieler(spielerName, passwort) {
        const saubererName = spielerName.trim().replace(/[^a-zA-Z0-9 äöüÄÖÜß\-_]/g, "");
        const emailName = saubererName
            .toLowerCase()
            .replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue").replace(/ß/gi, "ss")

        const fakeEmail = this._baueFakeEmail(emailName);
        const userCredential = await signInWithEmailAndPassword(this.auth, fakeEmail, passwort);
        await this.updateDocument("spieler", userCredential.user.uid, { lastLogin: Date.now() });
        return userCredential.user.uid;
    }

    /**
     * Gibt die UID des aktuell eingeloggten Benutzers zurück (oder null)
     */
    get aktuelleUid() {
        return this.auth.currentUser ? this.auth.currentUser.uid : null;
    }

    /**
     * Holt ein einzelnes Dokument aus einer Collection anhand der ID
     * @param {string} collectionName - Name der Collection (z.B. "spieler")
     * @param {string} docId - ID des Dokuments (z.B. Spielername)
     * @returns {Object|null} Die Daten des Dokuments oder null, wenn es nicht existiert
     */
    async getDocument(collectionName, docId) {
        const docRef = doc(this.db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) return docSnap.data();
        return null;
    }

    /**
     * Aktualisiert bestimmte Felder in einem bestehenden Dokument
     * @param {string} collectionName - Name der Collection
     * @param {string} docId - ID des Dokuments
     * @param {Object} data - Die zu aktualisierenden Felder (z.B. { fortschritt: 2 })
     */
    async updateDocument(collectionName, docId, data) {
        const docRef = doc(this.db, collectionName, docId);
        await updateDoc(docRef, data);
    }

    /**
     * Holt ALLE Dokumente aus einer bestimmten Collection
     * @param {string} collectionName - Name der Collection
     * @returns {Array} Ein Array aus Objekten, die die ID und die Daten enthalten
     */
    async getAllDocuments(collectionName) {
        const querySnapshot = await getDocs(collection(this.db, collectionName));
        const dokumente = [];
        
        querySnapshot.forEach((doc) => {
            dokumente.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return dokumente;
    }

    /**
     * Löscht ein bestimmtes Dokument aus einer Collection
     * @param {string} collectionName - Name der Collection (z.B. "spieler")
     * @param {string} docId - ID des zu löschenden Dokuments (z.B. Spielername)
     */
    async deleteDocument(collectionName, docId) {
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
        const docRef = doc(this.db, collectionName, docId);
        await setDoc(docRef, daten);
    }

    /**
     * Holt den aktuellen globalen Spielstatus
     * @returns {Promise<boolean>} true wenn freigegeben, false wenn pausiert
     */
    async istSpielFreigegeben() {
        const daten = await this.getDocument("spielStatus", "global");
        return daten ? daten.freigegeben : false; // Standardmäßig false, falls Dokument fehlt
    }

    /**
     * Schaltet den globalen Spielstatus um (Nur für Admin)
     * @param {boolean} status - true für freigeben, false für pausieren
     */
    async setzeSpielStatus(status) {
        await this.updateDocument("spielStatus", "global", { freigegeben: status });
    }

    /**
     * Holt den aktuellen Tipp Spielstatus
     * @returns {Promise<boolean>} true wenn freigegeben, false wenn deaktiviert
     */
    async istTippFreigegeben() {
        const daten = await this.getDocument("spielStatus", "global");
        return daten ? daten.tipps : false; // Standardmäßig false, falls Dokument fehlt
    }

    /**
     * Schaltet den Tipp Spielstatus um (Nur für Admin)
     * @param {boolean} status - true für freigeben, false für deaktiviert
     */
    async setzeTippStatus(status) {
        await this.updateDocument("spielStatus", "global", { tipps: status });
    }

    /**
     * Setzt eine globale Admin Nachricht
     * @param {string} msg - Text der Nachricht
     */
    async setzeAdminNachricht(msg) {
        await this.updateDocument("spielStatus", "global", { adminNachricht: msg });
    }

    /**
     * Ruft globale Admin Nachricht ab
     * @returns {string} Text der Nachricht
     */
    async getAdminNachricht() {
        const daten = await this.getDocument("spielStatus", "global");
        return daten ? daten.adminNachricht : "";
    }
}