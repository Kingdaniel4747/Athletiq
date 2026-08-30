# Health, Mealie und KI-Coach

## Health-Bereich

Über den Umschalter oben wechselst du zwischen **Gym** und **Health**. Im orangefarbenen
Health-Bereich lassen sich Mahlzeiten, Produkte, Kalorien, Makros, Wasser und Gewicht
gemeinsam auswerten.

### Produkte und Portionen

Ein Produkt kann manuell angelegt oder per Barcode über Open Food Facts gesucht werden.
Die Nährwerte werden pro 100 g gespeichert. Beim Eintragen wählst du die tatsächlich
gegessene Menge – zum Beispiel 35 g Toast und 40 g Schinken. So bleiben beliebige
Portionsgrößen möglich, auch wenn die Packung keine sinnvolle Portionsangabe enthält.

Die Barcode-Kamera benötigt auf echten Domains HTTPS und eine Browserfreigabe. Alternativ
kann der aufgedruckte Code eingetippt werden.

## Wasser

Das Tagesziel und die bereits getrunkene Menge werden getrennt gespeichert. Schnellbuttons
erfassen typische Gläser und Flaschen; die Flaschenanzeige visualisiert den Tagesfortschritt.
Wasseraufnahme und kurzfristige Gewichtsschwankungen sind Hinweise, aber keine verlässliche
Diagnose für Wassereinlagerungen.

## Mealie

Erzeuge in Mealie einen langlebigen API-Token und hinterlege serverseitig:

```dotenv
MEALIE_URL=https://mealie.example.com
MEALIE_API_TOKEN=dein-token
```

Nach `docker compose up -d` kann AthletiQ Rezepte suchen und vorhandene Nährwerte
übernehmen. Der Token wird nicht an das Frontend geschickt. Rezepte ohne vollständige
Nährwerte müssen vor dem Eintragen ergänzt oder geprüft werden.

## Coach-Ampel

Der lokale Coach funktioniert ohne KI-Dienst. Er betrachtet einen begrenzten Zeitraum und
bewertet:

- Gewichtstrend relativ zu deinem Ziel
- Kalorien- und Proteintreue
- regelmäßiges Protokollieren
- Trainingskonstanz
- progressive Überlastung in relevanten Übungen

Rot bedeutet Handlungsbedarf, Gelb beobachten und Grün im Zielbereich. Einzelne Tage führen
nicht sofort zu einer Änderung; Trends sind aussagekräftiger als tägliche Schwankungen.

## Optionaler KI-Coach

AthletiQ kann einen Chat-Completions-kompatiblen Endpunkt verwenden, etwa einen eigenen
lokalen Modellserver oder einen externen Anbieter:

```dotenv
AI_API_URL=http://host.docker.internal:11434/v1/chat/completions
AI_MODEL=dein-modell
AI_API_KEY=
```

Das Backend sendet nur den für die Analyse gebildeten Snapshot und eine begrenzte Liste
möglicher Übungen. Prüfe trotzdem die Datenschutzbedingungen des gewählten Anbieters.
Der Coach kann Vorschläge für Kalorien, Makros und Trainingsaufbau erzeugen. Sie werden
nicht automatisch aktiv: Du prüfst und bestätigst jede Änderung in der Oberfläche.

## Sicherheitsgrenzen

Die Berechnungen und KI-Ausgaben sind keine medizinische Diagnose. Extreme Defizite oder
Überschüsse, schnelle Gewichtsänderungen, Verletzungen, Essstörungen und Erkrankungen müssen
mit qualifiziertem Fachpersonal besprochen werden. AthletiQ soll Entscheidungen verständlich
machen, nicht medizinische Verantwortung ersetzen.

