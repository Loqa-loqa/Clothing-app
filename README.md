# KLOZI — Your Closet, Styled

Mobile-first PWA: fotografeer je kleding, bouw een virtuele kledingkast, en (in latere fases) stel outfits samen op een lichaamssilhouet.

## Status — Fase 1 (fundering) ✅

Wat er nu werkt:

- Project setup: Vite 5 + React 19, single-file inline styling (geen Tailwind/CSS-modules), soft pastel design system uit de spec.
- Firebase: Auth (email/wachtwoord + Google) en Firestore geïntegreerd, config in `.env.local`.
- **AuthScreen**: login/registreren, lichaamstype-keuze bij registratie.
- **ClosetScreen**: grid met categorie-tabs, zoeken, sorteren, statistieken, "niet gedragen in 30+ dagen"-sectie.
- **Add Item Flow**: foto kiezen/maken → upload naar Cloudinary → automatische achtergrondverwijdering (met preview en fallback) → categoriseren → details (kleur, patroon, seizoen, gelegenheid, merk, notities) → opslaan in Firestore.
- **ItemDetailScreen**: volledige weergave, favoriet-toggle, verwijderen.
- Bottom navigation (Today / Closet / Create / Calendar / Profile) — Today, Create en Calendar zijn nog placeholders.
- PWA-manifest + app-icons gegenereerd.

Nog te bouwen (volgende fases, zoals afgesproken):

1. **OutfitBuilderScreen** — het lastigste stuk: lichaamssilhouet, drag & drop, layer-systeem, tuck/roll/open controls, canvas-export.
2. HomeScreen (weer-widget, outfit van vandaag, statistieken).
3. OutfitsScreen, CalendarScreen (planner + weer), SocialScreen, uitgebreide ProfileScreen.
4. OpenWeatherMap-integratie (key nog niet ingevuld).

## Starten

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment variabelen

- `.env.local` bevat al je echte Firebase-config (klozi-24) — deze staat in `.gitignore` en gaat dus **niet** mee naar GitHub.
- Cloudinary staat nog op placeholders (`REPLACE_ME`). Vul in `.env.local` in:
  - `VITE_CLOUDINARY_CLOUD_NAME`
  - `VITE_CLOUDINARY_UPLOAD_PRESET` (maak een **unsigned** upload preset aan in Cloudinary → Settings → Upload)
  - Zolang dit niet is ingevuld, slaat de Add Item flow gewoon de originele foto op zonder achtergrondverwijdering — de app blijft dus bruikbaar.
- OpenWeatherMap-key (`VITE_OPENWEATHER_API_KEY`) is nog niet nodig voor deze fase.

## Firebase-checklist

In de Firebase Console (project `klozi-24`):

1. **Authentication** → Sign-in method → zet **E-mail/Wachtwoord** en **Google** aan.
2. **Firestore Database** → maak een database aan (test mode is prima om te beginnen).
3. Later, voor productie: schrijf Firestore security rules zodat gebruikers alleen hun eigen `users/{uid}` document en subcollecties kunnen lezen/schrijven. Nu staat dit nog open (test mode) — niet geschikt om public te draaien voordat dit is aangescherpt.

## Pushen naar je bestaande GitHub repo

```bash
cd klozi
git init   # als dit nog geen git-repo is
git remote add origin <jouw-repo-url>   # als 'origin' nog niet bestaat
git add .
git commit -m "Fase 1: project setup, auth, closet, add item flow"
git branch -M main
git push -u origin main
```

## Vercel

1. Importeer de repo in Vercel (of gebruik je bestaande project — koppel de juiste branch).
2. Zet in **Project Settings → Environment Variables** dezelfde variabelen als in `.env.local` (inclusief de Cloudinary- en later OpenWeatherMap-keys).
3. Build command: `npm run build` — Output directory: `dist` (Vercel detecteert dit automatisch als Vite-project).

## Structuur

```
klozi/
  src/
    firebase.js       # Firebase init + auth/Firestore helpers
    shared.js          # kleuren, categorieën, Cloudinary helpers, tuck-clip systeem
    App.jsx             # screen state, navigatie-shell
    screens/
      AuthScreen.jsx
      ClosetScreen.jsx
      AddItemFlow.jsx
      ItemDetailScreen.jsx
    components/
      BottomNav.jsx
  public/
    manifest.json, icons/
```

Noot: de originele spec beschrijft alles in één `App.jsx`-bestand. Voor onderhoudbaarheid — zeker omdat we in fases bouwen — is dit opgesplitst per scherm/component. Functioneel identiek, makkelijker uit te breiden.
