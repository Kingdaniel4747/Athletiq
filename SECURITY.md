# Sicherheit

Bitte veröffentliche Sicherheitslücken nicht als öffentliches Issue. Melde sie über
[GitHub Private Vulnerability Reporting](https://github.com/Kingdaniel4747/Athletiq/security/advisories/new).

Eine gute Meldung enthält betroffene Version, Angriffsvoraussetzungen,
Reproduktionsschritte, Auswirkungen und – falls vorhanden – einen Lösungsvorschlag.
Veröffentliche keine echten Tokens, Passkey-Daten oder persönlichen Gesundheitsdaten.

Unterstützt wird grundsätzlich die aktuelle `main`-Version beziehungsweise das neueste
Release. Sicherheitskorrekturen werden über neue GHCR-Images verteilt. Betreiber sollten
regelmäßig ausführen:

```bash
docker compose pull
docker compose up -d
```

