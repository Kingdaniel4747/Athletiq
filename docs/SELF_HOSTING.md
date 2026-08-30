# AthletiQ selbst hosten

## Einfacher Start

Lege `docker-compose.yml` in einen leeren Ordner und starte die Anwendung:

```bash
docker compose up -d
```

Ohne weitere Konfiguration läuft AthletiQ unter `http://localhost:8080`. Compose
lädt ein fertiges GHCR-Image. Auf dem Server entsteht nur ein dauerhafter Ordner:

- `./.athletiq`: Profile, Passkeys, Trainings- und Health-Daten, Sitzungsgeheimnis

Sichere `./.athletiq` regelmäßig. Übungsbilder und Animationen werden nicht auf dem
Server abgelegt. Beim ersten Öffnen kann jeder Nutzer sie mit **„Alles herunterladen“**
einmalig im eigenen Browser speichern. Dafür sind ungefähr 140 MB Browserspeicher nötig.
Der Offline-Cache benötigt HTTPS oder `localhost`; ohne ihn werden Medien online geladen.

## Domain und HTTPS

Außerhalb von `localhost` benötigen Passkeys, Kamera-Zugriff, PWA-Installation und
Push-Nachrichten HTTPS. Richte einen Reverse Proxy oder Tunnel vor Port 8080 ein und
lege eine `.env` neben die Compose-Datei:

```dotenv
RP_ID=athletiq.example.com
ORIGIN=https://athletiq.example.com
WEB_PORT=8080
RP_NAME=AthletiQ
```

`RP_ID` enthält nur den Hostnamen. `ORIGIN` enthält Protokoll und Hostname, aber keinen
abschließenden Slash. Bereits registrierte Passkeys sind an den alten Hostnamen gebunden;
bei einem Domainwechsel müssen neue Passkeys angelegt werden.

## Benutzer und Admin

Standardmäßig sind Registrierung und Gastmodus aktiv. Optional:

```dotenv
ALLOW_GUEST=0
INVITE_ONLY=1
ADMIN_UIDS=deine-benutzer-id
```

Registriere zunächst dein Profil. Die ID steht anschließend in `./.athletiq/db.json`. Nach
dem Setzen von `ADMIN_UIDS` und einem Neustart erscheint das Admin-Dashboard.

## Aktualisieren

```bash
docker compose pull
docker compose up -d
docker image prune
```

Der letzte Befehl ist optional und entfernt nur nicht mehr verwendete Images. Sichere vor
einem Update `./.athletiq`.

## Diagnose

```bash
docker compose ps
docker compose logs --tail=200 athletiq
docker compose config
```

Der Dienst `athletiq` sollte dauerhaft laufen und als healthy erscheinen.

Typische Ursachen:

- **GHCR-Zugriff verweigert:** Das Container-Paket `athletiq` im GitHub-Repository einmalig
  auf Public stellen.
- **Passkey-Fehler:** `RP_ID`, `ORIGIN` und Browser-Adresse stimmen nicht exakt überein
  oder HTTPS fehlt.
- **Keine Übungsbilder:** Internetzugang des Browsers prüfen. Für den Offline-Download ist
  zusätzlich HTTPS oder `localhost` erforderlich.
- **KI/Mealie nicht erreichbar:** Die Zieladresse muss aus dem API-Container erreichbar
  sein; für Dienste auf dem Docker-Host kann `host.docker.internal` verwendet werden.

## Wiederherstellung

1. Stack stoppen: `docker compose down`.
2. Gesicherten Ordner `.athletiq` zurückkopieren.
3. Stack starten: `docker compose up -d`.

Kein `docker compose down -v` verwenden, wenn zusätzliche benannte Volumes in einer
angepassten Compose-Datei wichtige Daten enthalten.
