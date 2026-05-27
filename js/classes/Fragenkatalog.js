export class Fragenkatalog {
    constructor() {
        // Hier liegen all deine Fragen und Antworten zentral an einem Ort
        this.fragen = [
            { frage: "Lea und Paul schnappen sich ihre Fahrräder und starten den Tag... Es geht, wie sollte es anders sein, zu Leas lieblings Waschhaus. Hier wollen die beiden einige Runden drehen. Mitten drin stoppt Lea und fragt Paul ob er lesen kann was der Gartenzwerg am Eingang da fragt?", antwort: "Kent jemand de kabouter die de afwas doet" },
            { frage: "Sehr gut! Aber habt ihr auch schon entdeckt wieviele Eichhörnchen euch beim waschen eurer Kleidung beobachten?", antwort: "3" },
            { frage: "Paul muss mal aufs Klo, aber es stinkt so doll... Wie viele gut belüftete Toiletten hat er am Waschhaus zur Auswahl, wenn 5 Kabinen bereits besetzt sind?", antwort: "13" },
            { frage: "Die beiden möchten nun spielen. Sie fahren zum nächstgelegenen Spielplatz auf dem man klettern kann. Zählt dort die Sprossen der Leiter, die Standfüße der Türme und addiert beides.", antwort: "20" },
            { frage: "Als nächste wollen die beiden sich in der Schatztruhe umsehen. Vielleicht hat ja jemand was nettes dort abgestellt. Sie kommen auf die Idee direkt vor der Hütte von Holzpflock zu Holzpflock zu springen. Wie oft muss Lea springen um die gesamte Strecke zu bewältigen?", antwort: "7" },
            { frage: "Autsch, das tat weh. Sie hat sich das Knie angestoßen. Jetzt ist die Hose dreckig. Ein Waschhaus mit Waschmaschine muss her... Kurz vor dem Ziel wird Lea abgelenkt und fragt sich... Was steht denn da auf dem blauen Schild in weißer Schrift? ? Die Buchstaben aus ihrem Namen erkennt sie. Wie viele Buchstaben erkennt Lea?", antwort: "6" },
            { frage: "Naja egal. &quot;Komm Paul, wir fahren weiter zum Schwimmbad.&quot; Auf dem Weg dorthin kommen sie an einigen Häusern vorbei. Eines davon sticht heraus. Welche Farbe hat das Dach des Hauses?", antwort: "rot" },
            { frage: "Am Schwimmbad angekommen stehen sie vor einem verschlossenen tor. Dieses hat viele Stäbe. Paul zählt...", antwort: "17" },
            { frage: "Lea bekommt langsam etwas Hunger... &quot;Komm wir fahren zu meiner Oma!&quot; Unterwegs kommen einige große Buckel auf der Straße, bei jedem ruft Paul &quot;Au mein Po!&quot; Aber wie oft ruft er es bis zur Ankunft?", antwort: "XXX" },
            { frage: "Bei Oma angekommen finden die beiden eine Dose mit Keksen. Als die Dose leer war, gab es natürlich Geheule, weil Paul genau einen Keks mehr verdrückt hat als Lea. Paul braucht pro Keks im Schnitt nur 5 Bissen, Lea genießt lieber mit 8 Bissen. Die 11 Kekse waren schnell verdrückt, aber wie oft haben die beiden eigentlich zugebissen?", antwort: "70" },
            { frage: "Die zwei beschließen zum Spielplatz weiter zu fahren. Paul möchte unbedingt auf die Seilrutsche. Angekommen schauen die beiden aber erstmal ob ihr Fisch gut durch getrocknet ist. Wie viele Fische haben die beiden bei ihrer letzten Fahrt zum trocknen aufgehangen?", antwort: "4" }
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