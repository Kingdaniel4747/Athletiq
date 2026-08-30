# Zu AthletiQ beitragen

Fehler und Ideen gehören in die
[GitHub Issues](https://github.com/Kingdaniel4747/Athletiq/issues). Beschreibe bei Bugs
Browser, Gerät, AthletiQ-Version, Reproduktionsschritte und relevante Logs. Entferne
Passkeys, Tokens, Namen und Gesundheitsdaten aus Screenshots und Log-Auszügen.

Für Code-Änderungen:

1. Fork erstellen und einen eigenen Branch verwenden.
2. Bestehenden Stil beibehalten und neue Logik mit Tests abdecken.
3. Vor dem Pull Request im Ordner `frontend` ausführen:

   ```bash
   npm ci
   npm test
   npm run build
   node scripts/check-locales.mjs
   npm run test:fatigue-probe
   ```

4. Zusätzlich `node --check api/server.js` und `docker compose config -q` prüfen.
5. Pull Request mit Zweck, Testnachweis und sichtbaren UI-Änderungen eröffnen.

Beiträge werden unter der bestehenden AGPL-3.0-or-later-Lizenz veröffentlicht.

