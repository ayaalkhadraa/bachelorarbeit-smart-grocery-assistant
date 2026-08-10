# Smart Grocery Assistant – Forschungsprototyp

Dieses Repository enthält den im Rahmen einer Bachelorarbeit entwickelten Forschungsprototyp eines **Smart Grocery Assistant**. Anhand des Prototyps wird untersucht, wie eine mit **Vue 3** und **PrimeVue** entwickelte Webanwendung unter Verwendung von **Capacitor** als Android-Anwendung bereitgestellt werden kann.

Im Mittelpunkt steht der Vergleich zweier mobiler Umsetzungsvarianten:

1. einer **PrimeVue–Capacitor-Variante**, bei der die bestehende PrimeVue-basierte Benutzeroberfläche weitgehend beibehalten und für die mobile Nutzung angepasst wurde;
2. einer **Ionic–Capacitor-Variante**, bei der die Präsentations- und Navigationsschicht mit Ionic-Vue-Komponenten neu gestaltet wurde.

Der Vue-3- und PrimeVue-Web-Prototyp bildet die gemeinsame Ausgangsbasis. Die vergleichende Evaluation bezieht sich auf die beiden Android-Varianten.

> **Hinweis:** Bei den enthaltenen Implementierungen handelt es sich um Forschungsprototypen. Sie sind nicht als produktionsreife Anwendungen für eine Veröffentlichung in einem App Store vorgesehen.

---

## Untersuchungsgegenstand

Die beiden mobilen Varianten werden in der Bachelorarbeit insbesondere hinsichtlich folgender Aspekte untersucht:

- funktionale Abdeckung;
- qualitative Wiederverwendung bestehender Anwendungsbestandteile;
- Größe der erzeugten Android-Anwendung;
- Start- und Rendering-Verhalten;
- responsive Darstellung und horizontales Overflow-Verhalten;
- Navigation und mobile Interaktion;
- subjektiv wahrgenommene Bedienbarkeit.

Eine quantitative Wiederverwendungsquote und eine zeitliche Messung des Implementierungsaufwands wurden nicht bestimmt.

---

## Implementierte Varianten

### Web-Prototyp

Der mit Vue 3 und PrimeVue entwickelte Web-Prototyp bildet die gemeinsame fachliche und technische Ausgangsbasis. Seine Darstellung im mobilen Browser wird in der Arbeit dokumentiert, er stellt jedoch keine dritte Android-Variante innerhalb des abschließenden Vergleichs dar.

### PrimeVue–Capacitor-Variante

In dieser Variante wird die bestehende PrimeVue-basierte Benutzeroberfläche weitgehend beibehalten und gezielt für die mobile Nutzung angepasst. Capacitor dient als native Laufzeitumgebung und ermöglicht die Ausführung der gebündelten Webressourcen innerhalb einer Android-Anwendung.

### Ionic–Capacitor-Variante

In dieser Variante werden die Präsentations- und Navigationsschicht mit Ionic-Vue-Komponenten neu gestaltet. Fachliche Grundlogik, Pinia-basierte Zustandsverwaltung, Datenmodell und lokale Persistenz werden soweit möglich wiederverwendet oder angepasst. Capacitor wird auch hier als native Laufzeitumgebung eingesetzt.

---

## Repository-Struktur

Die relevanten Projektstände sind über unterschiedliche Branches und Tags dokumentiert.

| Branch oder Referenz | Bedeutung |
|---|---|
| `main` | Zentrale Projektübersicht und Dokumentation der Repository-Struktur |
| `develop` | Web-Prototyp mit Vue 3 und PrimeVue als gemeinsame Ausgangsbasis |
| `feature/capacitor-version` | Abschließender Implementierungsstand der PrimeVue–Capacitor-Variante |
| `feature/ionic-app` | Abschließender Implementierungsstand der Ionic–Capacitor-Variante |
| `feature/ionic-comparison-experiments` | Früher experimenteller Ionic-Entwicklungsstand; nicht Bestandteil der abschließenden vergleichenden Evaluation |
| `ba-primevue-capacitor-evaluation-v1.0` | Repository-Stand der PrimeVue–Capacitor-Variante zum Zeitpunkt der technischen Evaluation |
| `ba-ionic-capacitor-evaluation-v1.0` | Repository-Stand der Ionic–Capacitor-Variante zum Zeitpunkt der technischen Evaluation |

Der experimentelle Ionic-Branch dokumentiert eine frühe Erprobungsphase. Er wurde nicht als eigenständige Variante in die abschließende Evaluation einbezogen.

---

## Evaluation-Tags und Releases

Für die technische Evaluation wurden zwei versionierte Repository-Stände gekennzeichnet:

| Variante | Evaluation-Tag | Commit |
|---|---|---|
| PrimeVue–Capacitor | `ba-primevue-capacitor-evaluation-v1.0` | `aa4f80b` |
| Ionic–Capacitor | `ba-ionic-capacitor-evaluation-v1.0` | `300bdad` |

Die beiden Evaluation-Tags kennzeichnen jeweils den konkreten Repository-Stand, auf dessen Grundlage die technischen Messungen und Tests durchgeführt wurden. Die zugehörigen GitHub-Releases enthalten die auf Grundlage dieser Stände erzeugten Mess- und Evaluationsartefakte.

Dazu gehören insbesondere Artefakte zu folgenden Untersuchungsbereichen:

- Startverhalten;
- Frame-Timing und Rendering-Verhalten;
- Scroll- und Navigationstests;
- responsive Darstellung und horizontales Overflow-Verhalten;
- Größe der erzeugten Android-Anwendung.

Die in der Bachelorarbeit ausgewerteten technischen Messergebnisse beziehen sich ausschließlich auf die durch diese Tags gekennzeichneten Repository-Stände.

---

## Abschließende Implementierungsstände

Zum Zeitpunkt der Abgabe bilden die jeweils letzten Commits des Branches `feature/capacitor-version` und des Branches `feature/ionic-app` die abschließenden Implementierungsstände der beiden Android-Varianten.
Diese Stände können gegenüber den Evaluation-Ständen punktuelle funktionale Korrekturen enthalten. Solche späteren Änderungen verändern weder die durch die Evaluation-Tags dokumentierten Repository-Stände noch die auf deren Grundlage erhobenen technischen Messergebnisse.

Damit wird zwischen zwei Arten von Projektständen unterschieden:

- Die **Evaluation-Tags** dokumentieren die konkreten Code-Stände, auf denen die technischen Messungen beruhen.
- Die **abschließenden Branch-Stände** dokumentieren die finalen Implementierungen zum Zeitpunkt der Abgabe.

---

## Zentrale Technologien

Der Prototyp basiert insbesondere auf folgenden Technologien:

- Vue 3;
- TypeScript;
- Vite;
- PrimeVue;
- Ionic Vue;
- Pinia;
- Capacitor;
- Android;
- Leaflet;
- Express für einen begrenzten prototypischen WebAuthn-Ablauf.

Über Capacitor beziehungsweise Capacitor-kompatible Plugins werden exemplarisch native oder gerätenahe Funktionen eingebunden. Dazu gehören unter anderem Kamera, Standortbestimmung, lokale Benachrichtigungen und eine lokale Biometrieprüfung.

---

## Lokale Ausführung

### Voraussetzungen

Für die lokale Ausführung werden grundsätzlich folgende Werkzeuge benötigt:

- Node.js und npm;
- Android Studio mit installiertem Android SDK für die Android-Varianten;
- eine geeignete Java- beziehungsweise JDK-Installation für den Android-Build.

Die konkret verwendeten Abhängigkeiten und Versionen sind in den jeweiligen `package.json`- und Lock-Dateien dokumentiert.

### Branch auswählen

Nach dem Klonen des Repositorys muss zunächst der gewünschte Projektstand ausgewählt werden:

```bash
git switch BRANCH_NAME
```

Dabei ist `BRANCH_NAME` durch den Namen des Branches zu ersetzen.

### Abhängigkeiten installieren

```bash
npm ci
```

### Webanwendung im Entwicklungsmodus starten

```bash
npm run dev
```

### Android-Projekt aktualisieren und öffnen

Für eine Capacitor-basierte Android-Variante können die Webressourcen gebündelt und mit dem nativen Android-Projekt synchronisiert werden:

```bash
npm run build
npx cap sync android
npx cap open android
```

Der weitere Build und die Ausführung auf einem Emulator oder einem physischen Android-Gerät erfolgen über Android Studio.

---

## Abgrenzung

Die praktische Implementierung und technische Evaluation sind auf Android beschränkt. Ionic und Capacitor unterstützen grundsätzlich auch iOS; eine iOS-Version wurde im Rahmen der Arbeit jedoch nicht eingerichtet oder praktisch getestet.

Der Prototyp umfasst kein produktionsreifes Backend, keine vollständige serverseitige Datensynchronisation und keine umfassende Sicherheitsanalyse. Gerätespezifische Funktionen wurden exemplarisch und in begrenztem Umfang integriert.

Der lokale Biometrieablauf verwendet `NativeBiometric.verifyIdentity()` zur Durchführung einer lokalen Biometrieprüfung. Nach erfolgreicher Prüfung wird ein lokal gespeichertes Demo-Profil geladen. Der Ablauf stellt weder eine WebAuthn-basierte Passkey-Authentifizierung noch eine serverseitig verifizierte Benutzeranmeldung dar.

Die technischen Messungen wurden unter definierten Bedingungen auf einem physischen Android-Testgerät durchgeführt. Die Ergebnisse sind daher als kontextspezifisch zu interpretieren und nicht ohne Weiteres auf sämtliche Android-Geräte übertragbar.

---

## Weiterführende Dokumentation

- [Vue Documentation](https://vuejs.org/guide/)
- [PrimeVue Documentation](https://primevue.org/)
- [Ionic Vue Documentation](https://ionicframework.com/docs/vue/overview)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vite Documentation](https://vite.dev/guide/)

---

## Wissenschaftlicher Kontext

Das Repository dient der Dokumentation und Nachvollziehbarkeit der im Rahmen der Bachelorarbeit entwickelten Implementierungen. Die wissenschaftliche Einordnung, die vollständige Evaluationsmethodik, die Ergebnisse sowie deren Diskussion sind Bestandteil der schriftlichen Arbeit.

Die im Repository enthaltenen Implementierungen und Evaluationsartefakte sind deshalb stets im Zusammenhang mit den in der Bachelorarbeit beschriebenen Untersuchungsbedingungen und Einschränkungen zu interpretieren.
