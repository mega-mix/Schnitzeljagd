import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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
    }

    /**
     * Holt ein einzelnes Dokument aus einer Collection anhand der ID
     * @param {string} collectionName - Name der Collection (z.B. "gruppen")
     * @param {string} docId - ID des Dokuments (z.B. Gruppenname)
     * @returns {Object|null} Die Daten des Dokuments oder null, wenn es nicht existiert
     */
    async getDocument(collectionName, docId) {
        const docRef = doc(this.db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        }
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
}