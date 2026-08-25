# Fitness-openGym installieren

Diese Edition lässt den bestehenden openGym-Trainingsbereich unverändert und
ergänzt einen separaten, orangefarbenen Ernährungsbereich. Alle persönlichen
Daten bleiben im gemounteten Ordner `data/` deines Servers.

## 1. Mit Docker starten

Voraussetzungen: Docker Engine und Docker Compose v2.

```bash
cp .env.example .env
docker compose up -d --build
```

Danach ist die App standardmäßig unter `http://localhost:8080` erreichbar. Beim
ersten Start werden die Übungsmedien einmalig heruntergeladen. Sichere den
Ordner `data/` regelmäßig; dort liegen Benutzer, Passkeys, Trainings- und
Ernährungsdaten.

Für eine echte Domain brauchst du HTTPS. Setze in `.env` mindestens:

```dotenv
RP_ID=gym.example.com
ORIGIN=https://gym.example.com
WEB_PORT=8080
```

Der Reverse Proxy zeigt dann auf Port 8080. Passkeys und Kamerazugriff für den
Barcode-Scanner funktionieren im Browser nur über HTTPS oder auf `localhost`.
Weitere Proxy-Hinweise stehen in [SELF_HOSTING.md](SELF_HOSTING.md).

## 2. Ernährung ohne externe Konten

Manuelle Lebensmittel, Mengen, Einheiten, Kalorien, Makros und Wasser laufen
sofort. Produkt-Barcodes werden über Open Food Facts gesucht. Passe in `.env`
den Kontakt des `FOOD_USER_AGENT` an, damit dein Server korrekt identifizierbar
ist.

Ein Barcode kann per Hand eingetippt werden, falls der verwendete mobile Browser
die eingebaute Barcode-Erkennung nicht unterstützt.

## 3. Mealie verbinden (optional)

Erstelle in Mealie ein langlebiges API-Token und trage nur serverseitig ein:

```dotenv
MEALIE_URL=https://mealie.example.com
MEALIE_API_TOKEN=dein-token
```

Danach genügt:

```bash
docker compose up -d --build api web
```

Das Token wird nicht an den Browser geschickt. Rezepte mit hinterlegten
Nährwerten können gesucht und als Portion ins Ernährungstagebuch übernommen
werden.

## 4. KI-Coach verbinden (optional)

Ohne KI läuft bereits eine lokale Ampel-Auswertung. Für begründete Ernährungs-
und Trainingsplan-Vorschläge kann ein Chat-Completions-kompatibler Anbieter
eingetragen werden. Beispiel für einen lokalen Ollama-kompatiblen Endpunkt:

```dotenv
AI_API_URL=http://host.docker.internal:11434/v1/chat/completions
AI_MODEL=dein-modell
AI_API_KEY=
```

Für einen Cloud-Anbieter setzt du dessen vollständige Chat-Completions-URL,
Modellnamen und API-Key. Danach API und Web neu bauen/starten:

```bash
docker compose up -d --build api web
```

Der Coach sendet nur eine kompakte Trend-Zusammenfassung, den aktuellen Plan
und eine begrenzte Übungsauswahl an den konfigurierten Anbieter. Rohdaten wie
einzelne Mahlzeitennamen werden nicht übertragen. Kalorien-/Makroänderungen und
neue Trainingspläne sind immer Vorschläge: Erst deine ausdrückliche Bestätigung
wendet sie an. Alte Routinen und der Trainingsverlauf bleiben erhalten.

Die Ampel und KI ersetzen keine ärztliche oder ernährungsmedizinische Beratung.
Bei Erkrankungen, Schwangerschaft, Essstörungen oder starken Gewichtsänderungen
sollten Ziele fachlich abgestimmt werden.

## 5. In ein eigenes GitHub-Repository legen

Erstelle auf GitHub ein leeres Repository ohne zusätzliche README und führe im
Projektordner aus:

```bash
git init
git add .
git commit -m "Add nutrition tracking and AI coach"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/DEIN-REPO.git
git push -u origin main
```

`.env`, `data/`, heruntergeladene Medien, Build-Ausgaben und `node_modules`
sind bereits ausgeschlossen. Committe niemals API-Tokens. Der vorhandene
GitHub-Actions-Testworkflow kann anschließend für jeden Push laufen.

Dieses Projekt basiert auf openGym und bleibt unter AGPL-3.0. Wenn du eine
veränderte Version über ein Netzwerk anbietest, musst du den Benutzern den
zugehörigen Quellcode gemäß der Lizenz zugänglich machen.

## 6. Aktualisieren und Diagnose

```bash
git pull
docker compose up -d --build
docker compose ps
docker compose logs -f api web
```

Bei einem Umzug kopierst du das Repository, deine `.env`, den Ordner `data/`
und optional den bereits geladenen Ordner `media/` auf den neuen Server.
