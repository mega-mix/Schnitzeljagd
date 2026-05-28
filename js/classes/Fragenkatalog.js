export class Fragenkatalog {
    constructor() {
        // Fragenkatalog
        this.fragen = [
            {   frage: "",
                antwort: "",
                hinweis: "" },
                
            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" },

            {   frage: "",
                antwort: "",
                hinweis: "" }
        ];
    }

    // Gibt die Gesamtanzahl der Fragen zurück
    get anzahlFragen() {
        return this.fragen.length;
    }

    // Holt die Frage für einen bestimmten Fortschritts-Index
    getFrage(index) {
        if (index >= 0 && index < this.anzahlFragen) {
            return this.fragen[index].frage;
        }
        return null;
    }

    // Prüft, ob die eingegebene Antwort korrekt ist (gibt true oder false zurück)
    pruefeAntwort(index, spielerAntwort) {
        if (index >= 0 && index < this.anzahlFragen) {
            const korrekteAntwort = this.fragen[index].antwort.toLowerCase().trim();
            const bereinigteSpielerAntwort = spielerAntwort.toLowerCase().trim();
            return bereinigteSpielerAntwort === korrekteAntwort;
        }
        return false;
    }
}