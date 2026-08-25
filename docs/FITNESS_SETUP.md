# Fitness-openGym installieren

Diese Edition lässt den bestehenden openGym-Trainingsbereich unverändert und
ergänzt einen separaten, orangefarbenen Ernährungsbereich. Alle persönlichen
Daten bleiben im gemounteten Ordner `data/` deines Servers.

## 1. Mit Docker starten

Voraussetzungen: Docker Engine mit Docker Compose. Eine lokale Node-, npm-, Git-
oder Programmierumgebung ist nicht nötig. Es wird nur eine Compose-Datei
heruntergeladen.

```bash
mkdir athletiq && cd athletiq
curl -fsSLO https://raw.githubusercontent.com/Kingdaniel4747/Athletiq/main/docker-compose.yml
docker compose up -d
```

Compose lädt die fertigen Athletiq-Images für AMD64 oder ARM64 automatisch aus
GitHub Container Registry. Das ist die vollständige Testinstallation. Eine
`.env`-Datei und der restliche Quellcode sind nicht erforderlich. Danach ist
die App auf dem Docker-Rechner unter
`http://localhost:8080` und im lokalen Netzwerk unter
`http://SERVER-IP:8080` erreichbar. Beim ersten Start werden die Übungsmedien
einmalig heruntergeladen. Sichere den Ordner `data/` regelmäßig; dort liegen
Benutzer, Passkeys, Trainings- und Ernährungsdaten.

Status und Logs:

```bash
docker compose ps
docker compose logs --tail=100 api web media
```

Für einen schnellen Test über eine Server-IP verwendest du den Gastmodus.
Passkeys, PWA-Installation und Kamerazugriff benötigen HTTPS oder `localhost`.

Nur wenn du Einstellungen ändern möchtest, kopierst du die Vorlage:

```bash
cp .env.example .env
```

Für eine echte Domain brauchst du HTTPS. Setze in der optionalen `.env`
mindestens:

```dotenv
RP_ID=athletiq.example.com
ORIGIN=https://athletiq.example.com
WEB_PORT=8080
RP_NAME=Athletiq
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
docker compose up -d api web
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
docker compose up -d api web
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
curl -fsSL https://raw.githubusercontent.com/Kingdaniel4747/Athletiq/main/docker-compose.yml -o docker-compose.yml
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f api web
```

Bei einem Umzug kopierst du die Compose-Datei, deine optionale `.env`, den
Ordner `data/` und optional den bereits geladenen Ordner `media/` auf den neuen
Server.

### Einmalig für den Repository-Eigentümer

Der Workflow `.github/workflows/docker-publish.yml` baut und veröffentlicht bei
jedem Push auf `main` automatisch beide Plattform-Images:

- `ghcr.io/kingdaniel4747/athletiq-api:latest`
- `ghcr.io/kingdaniel4747/athletiq-web:latest`

Nach dem ersten erfolgreichen Workflow unter GitHub **Packages** bei beiden
Paketen **Package settings → Change visibility → Public** wählen. Erst öffentliche
GHCR-Pakete können fremde Docker-Server ohne GitHub-Anmeldung herunterladen.
