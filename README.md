# FreshFlow – Smart Grocery Assistant

## Projektbeschreibung

FreshFlow ist ein Vue-basierter Prototyp zur Verwaltung von Lebensmitteln, Einkaufsliste und Ablaufdaten.

Der Prototyp dient als Grundlage zur Untersuchung der mobilen Übertragbarkeit mit Capacitor.

## Technologien

- Vue 3
- PrimeVue
- Tailwind CSS
- Pinia
- LocalStorage
- Vite
- Capacitor
- Android Studio

## Web-Version

Installation:

```sh
npm install
```

Start:

```sh
npm run dev
```

Build:

```sh
npm run build
```

## Android-Capacitor-Version

Capacitor nutzt den Vite-Build aus `dist` und führt die Web-App in einem Android-Container aus.

Sync:

```sh
npx cap sync android
```

Android öffnen:

```sh
npx cap open android
```

Hinweis: Nach Änderungen an der Web-App immer zuerst `npm run build` und danach `npx cap sync android` ausführen.

## Native Funktionen in der Android-Version

- Barcode-Scanner
- Standortabfrage
- native biometrische Anmeldung
- lokale Benachrichtigungen für bald ablaufende Produkte

## Hinweise und Grenzen

- Die Android-Version ist prototypisch.
- PrimeVue-Komponenten bleiben Webkomponenten innerhalb der WebView.
- Local Notifications werden verwendet, keine Firebase- oder Push-Notifications.
- Keine vollständige Benutzerverwaltung.
- iOS wurde nicht praktisch getestet, da macOS/Xcode erforderlich ist.
