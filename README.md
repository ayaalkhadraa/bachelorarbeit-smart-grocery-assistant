# FreshFlow – Smart Grocery Assistant

## Ionic–Capacitor-Version

## Projektbeschreibung

FreshFlow ist ein mit Vue 3 entwickelter Prototyp zur Verwaltung von Lebensmittelvorräten, Einkaufslisten und Ablaufdaten.

Diese Variante verwendet Ionic für die Präsentations- und Navigationsschicht und Capacitor für die Bereitstellung als Android-Anwendung. Geschäftslogik, Pinia-Stores, Datenmodell, lokale Persistenz und native Capacitor-Funktionen wurden soweit möglich aus der PrimeVue–Capacitor-Variante weiterverwendet.

## Technologien

- Vue 3
- Ionic Vue
- Ionic Vue Router
- Pinia
- `localStorage`
- Vite
- Capacitor
- Android Studio

## Installation und Web-Ausführung

Abhängigkeiten installieren:

```bash
npm install
```

Entwicklungsserver starten:

```bash
npm run dev
```

Produktions-Build erstellen:

```bash
npm run build
```

## Ionic–Capacitor-Android-Version

Capacitor verwendet den von Vite erzeugten Build aus dem Verzeichnis `dist` und führt die Anwendung innerhalb einer nativen Android-WebView aus.

Web-Build mit dem Android-Projekt synchronisieren:

```bash
npx cap sync android
```

Android-Projekt in Android Studio öffnen:

```bash
npx cap open android
```

Nach Änderungen an der Anwendung müssen zuerst der Web-Build neu erstellt und anschließend das Android-Projekt synchronisiert werden:

```bash
npm run build
npx cap sync android
```

## Ionic-Benutzeroberfläche

Die sichtbaren UI-Komponenten sowie die Seiten- und Navigationsstruktur wurden mit Ionic Vue umgesetzt. Verwendet werden unter anderem:

- `IonPage` und `IonContent` für die Seitenstruktur
- `IonTabs` und `IonRouterOutlet` für die Navigation
- `IonList` und `IonItem` für listenbasierte Darstellungen
- `IonItemSliding` für Swipe-Aktionen
- `IonFab` für mobile Schnellaktionen
- `IonModal` für modale Inhalte
- `IonToggle`, `IonSelect` und weitere Ionic-Eingabekomponenten

## Native Funktionen der Android-Version

- Barcode-Erfassung
- Standortabfrage
- native biometrische Authentifizierung
- lokale Benachrichtigungen für bald ablaufende Produkte

Die nativen Funktionen werden über Capacitor beziehungsweise Capacitor-kompatible Plugins bereitgestellt.

## Hinweise und Grenzen

- Die Android-Version ist ein Prototyp und nicht für den produktiven Einsatz vorgesehen.
- Die Benutzeroberfläche wird mit Ionic-Komponenten innerhalb der Android-WebView dargestellt.
- Die Untersuchung bezieht sich auf die konkrete Ionic–Capacitor-Implementierung.
- Lokale Benachrichtigungen werden direkt auf dem Gerät geplant; Firebase- oder serverbasierte Push-Benachrichtigungen werden nicht verwendet.
- Es besteht keine vollständige Benutzer- oder Kontoverwaltung.
- Produkt- und Einkaufsdaten werden lokal gespeichert und nicht zwischen Geräten synchronisiert.
- iOS wird grundsätzlich von Ionic und Capacitor unterstützt, wurde in diesem Projekt jedoch mangels einer macOS-Umgebung mit Xcode nicht praktisch getestet.

## Dokumentation

- [Ionic Vue – offizielle Dokumentation](https://ionicframework.com/docs/vue/overview)
- [Capacitor – offizielle Dokumentation](https://capacitorjs.com/docs)
