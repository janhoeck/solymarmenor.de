# Property-Daten

Diese JSON-Dateien werden beim Import gegen `src/data/property-schema.ts` validiert – eine
ungültige Änderung lässt den Build fehlschlagen.

## Unverifizierte Werte in `house.json`

Die `highlights`-Werte (`guests`, `beds`, `bathrooms`, `area`) in `house.json` wurden bei der
Umstellung von `propertyDetails` auf `highlights` unverändert aus den bisherigen Daten
übernommen. Der entsprechende Block war dort eine byte-identische Kopie des Blocks aus
`apartment.json` – die Werte sind daher nicht verifiziert.

Der Beschreibungstext des Hauses selbst erwähnt zwei Schlafzimmer mit zwei Einzelbetten und
einem Doppelbett. Das deutet auf `bedrooms: 2` und `beds: 3` hin, nicht auf das übernommene
`beds: 4`. Die Fläche von 95 m² ist sehr wahrscheinlich der Wert der Wohnung, nicht des Hauses.

Außerdem enthält `house.json` bisher gar keinen `bedrooms`-Eintrag, weil die alten Daten dafür
keinen Wert enthielten.

Diese Werte müssen vom Eigentümer bestätigt und bei Bedarf direkt in `house.json` korrigiert
werden.
