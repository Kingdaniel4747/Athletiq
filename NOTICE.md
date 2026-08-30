# Rechtliche Hinweise und Drittanbieter

## Herkunft und Lizenz

AthletiQ ist eine umfangreich veränderte Weiterentwicklung von **openGym**, Copyright
(C) 2026 Duarte Santos. Diese Herkunftsangabe ist aus Lizenz- und Transparenzgründen
bewusst erhalten; sie ist kein aktueller Produktname und keine Verbindung des ursprünglichen
Autors mit dem AthletiQ-Projekt.

Der Programmcode steht unter der **GNU Affero General Public License Version 3 oder neuer**.
Der vollständige Lizenztext befindet sich in [LICENSE](LICENSE). Bei Bereitstellung einer
veränderten Version über ein Netzwerk gelten insbesondere die Quellcodepflichten der AGPL.

## Body-Map-Geometrie

Die Muskelkonturen in `frontend/src/lib/body-paths.js` wurden aus
[MuscleMap](https://github.com/melihcolpan/MuscleMap) von Melih Colpan abgeleitet und
unter der MIT-Lizenz verwendet. Die Swift-Pfade wurden in ein JavaScript-Datenmodul
überführt und Untergruppen entfernt.

```text
MIT License

Copyright (c) 2026 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Übungsdaten

Übungsnamen, Attribute und Anleitungen stammen aus ExerciseDB v1 und werden über
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
bezogen. Der Upstream-Datensatz stellt Metadaten und Anleitungstexte unter folgender
MIT-Lizenz bereit:

```text
MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Übungsbilder und Animationen

Die Bilder und GIFs sind nicht Bestandteil dieses Repositorys oder der AthletiQ-Images.
Der `media`-Service lädt sie beim ersten Start direkt aus dem oben genannten Datensatz.
Sie sind weder durch dessen MIT-Lizenz für Metadaten noch durch die AGPL von AthletiQ
abgedeckt. Der Upstream nennt Gym visual als Rechteinhaber; ExerciseDB veröffentlicht
separate Bedingungen. Wer diese Medien weiterverwenden oder öffentlich anbieten möchte,
muss die dafür nötigen Rechte selbst prüfen und einholen.

Weitere beteiligte Open-Source-Pakete sind in den jeweiligen `package.json`- und
Lock-Dateien dokumentiert und unter ihren eigenen Lizenzen verfügbar.

