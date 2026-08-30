# Health, Mealie und KI-Coach

## Health-Bereich

Über den Umschalter oben wechselst du zwischen **Gym** und **Health**. Im orangefarbenen
Health-Bereich lassen sich Mahlzeiten, Produkte, Kalorien, Makros, Wasser und Gewicht
gemeinsam auswerten.

## Persönliche Ausgangsbasis

Das Onboarding verbindet Alter, Größe, Gewicht, Ziel, Aktivität, Schritte,
Trainingstage, Erfahrung, Ausrüstung, Skills und Ernährungsvorlieben. Die berechneten
Kalorien, Makros, Proteinspanne und Wassermenge sind ein konservativer Startwert.
Minderjährige, Schwangerschaft/Stillzeit und ein Abnehmziel bei Untergewicht stoppen
die automatische Zielberechnung.

Die Logik orientiert sich an vorsichtigen, nachvollziehbaren Leitplanken: Der
[NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner)
behandelt Energiebedarf als dynamisch und schließt unter anderem Minderjährige sowie
Schwangerschaft/Stillzeit aus. Die Proteinspanne für aktive Erwachsene liegt innerhalb
der in der [ISSN-Position](https://pubmed.ncbi.nlm.nih.gov/28642676/) beschriebenen
1,4–2,0 g/kg. AthletiQ behandelt schnelle Tagesänderungen nicht als Signal und bleibt
bei Gewichtsänderungen konservativ; die
[CDC](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html) empfiehlt
bei Gewichtsabnahme ein schrittweises Vorgehen.

### Produkte und Portionen

Ein Produkt kann manuell angelegt oder per Barcode über Open Food Facts gesucht werden.
Die Nährwerte werden pro 100 g gespeichert. Beim Eintragen wählst du die tatsächlich
gegessene Menge – zum Beispiel 35 g Toast und 40 g Schinken. So bleiben beliebige
Portionsgrößen möglich, auch wenn die Packung keine sinnvolle Portionsangabe enthält.

Häufige Lebensmittel lassen sich favorisieren und danach mit einem Tippen in der
Standardportion erfassen. Mahlzeiten können als Vorlage gespeichert oder vom Vortag
kopiert werden. Roh/gekocht und die Datenquelle werden sichtbar gespeichert, damit
eine scheinbar genaue Zahl nicht besser wirkt als ihre Quelle.

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
- Calisthenics-Stufe, Assistenz, Zusatzgewicht, Technikqualität und Schmerz
- Schlaf, Energie, Hunger, Stress, Muskelkater, Schritte und Krankheit

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

Der Coach priorisiert höchstens zwei nächste Schritte. Kalorienänderungen sind klein
begrenzt. Gelenk- oder Sehnenschmerz ab 4/10 sperrt eine schwierigere Trainings- oder
Skill-Progression. Übernommene Ernährungsziele werden protokolliert und lassen sich
rückgängig machen.

## Fortschritt und Datenschutz

Körpermaße werden mit dem Profil synchronisiert. Optionale Fortschrittsfotos werden
dagegen ausschließlich in der lokalen Browser-Datenbank gespeichert: Sie werden
weder synchronisiert noch an einen KI-Anbieter gesendet und sind nicht im JSON-Backup
enthalten.

## Sicherheitsgrenzen

Die Berechnungen und KI-Ausgaben sind keine medizinische Diagnose. Extreme Defizite oder
Überschüsse, schnelle Gewichtsänderungen, Verletzungen, Essstörungen und Erkrankungen müssen
mit qualifiziertem Fachpersonal besprochen werden. AthletiQ soll Entscheidungen verständlich
machen, nicht medizinische Verantwortung ersetzen.
