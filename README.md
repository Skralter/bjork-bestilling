# Bjørk Bestilling

En produksjonsklar bestillingsapplikasjon for produkter, bygget med Node.js, Express, EJS, PostgreSQL og Prisma. Løsningen er laget for å være nybegynnervennlig å sette opp lokalt og enkel å publisere på Railway.

## 1. Hva applikasjonen gjør

Applikasjonen lar brukere registrere seg, vente på godkjenning fra administrator, logge inn, se aktive produkter og lagre eller endre egne bestillinger.

Administrator kan:

- godkjenne eller avslå brukere
- deaktivere og reaktivere brukere
- gjøre brukere til administratorer
- opprette, redigere, aktivere, deaktivere, markere som utsolgt og arkivere produkter
- se bestillingsoversikt per produkt
- eksportere bestillinger til CSV

## 2. Arkitekturoversikt

Prosjektet består av fire hoveddeler:

1. `server.js` starter Express-applikasjonen.
2. `src/app.js` setter opp middleware, sessions, sikkerhet og ruter.
3. `src/controllers`, `src/services`, `src/routes` og `src/middleware` håndterer logikken.
4. `src/views` og `public` inneholder design, EJS-maler og klient-JavaScript.

Databasen er PostgreSQL, og Prisma brukes som ORM. Sessions lagres også i PostgreSQL for at innlogging skal fungere stabilt på Railway.

## 3. Mappestruktur

Kjør alle kommandoer fra prosjektroten:

`C:\Users\wsand\OneDrive\Documents\Nettside Bjørk`

```text
project-root/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.js
├─ public/
│  ├─ css/
│  │  └─ styles.css
│  ├─ images/
│  │  └─ product-placeholder.svg
│  └─ js/
│     └─ app.js
├─ src/
│  ├─ config/
│  │  ├─ env.js
│  │  └─ prisma.js
│  ├─ controllers/
│  │  ├─ accountController.js
│  │  ├─ adminController.js
│  │  ├─ authController.js
│  │  └─ productController.js
│  ├─ middleware/
│  │  ├─ auth.js
│  │  ├─ errorHandlers.js
│  │  └─ viewData.js
│  ├─ routes/
│  │  ├─ accountRoutes.js
│  │  ├─ adminRoutes.js
│  │  ├─ authRoutes.js
│  │  └─ productRoutes.js
│  ├─ services/
│  │  ├─ adminService.js
│  │  ├─ authService.js
│  │  ├─ orderService.js
│  │  └─ productService.js
│  ├─ utils/
│  │  ├─ constants.js
│  │  ├─ csv.js
│  │  ├─ formatters.js
│  │  └─ productAvailability.js
│  ├─ validators/
│  │  ├─ authValidators.js
│  │  ├─ orderValidators.js
│  │  └─ productValidators.js
│  ├─ views/
│  │  ├─ account/
│  │  ├─ admin/
│  │  ├─ auth/
│  │  ├─ errors/
│  │  ├─ partials/
│  │  └─ products/
│  └─ app.js
├─ tests/
│  └─ validators.test.js
├─ .env.example
├─ .gitignore
├─ package.json
├─ README.md
└─ server.js
```

## 4. Programmer du må installere

Du trenger:

1. Node.js
2. Git
3. PostgreSQL

## 5. Hvordan installere Node.js

Gå til [https://nodejs.org/](https://nodejs.org/) og last ned LTS-versjonen.

Kontroller installasjonen i terminalen:

```powershell
node -v
npm -v
```

## 6. Hvordan laste ned prosjektet

Hvis prosjektet allerede ligger lokalt, kan du hoppe videre til `.env`.

Hvis du senere kloner det fra GitHub, bruker du:

```powershell
git clone https://github.com/DITT-BRUKERNAVN/DITT-REPO.git
cd "DITT-REPO"
```

## 7. Hvordan opprette `.env`

Lag en kopi av `.env.example` og kall den `.env`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Fyll inn egne verdier i `.env`.

Eksempel:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bjork_bestilling?schema=public"
SESSION_SECRET="lag-en-lang-tilfeldig-hemmelighet-her"
ADMIN_NAME="Første Administrator"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="et-sterkt-passord-her"
NODE_ENV="development"
PORT="3000"
SESSION_COOKIE_NAME="bjork.sid"
SEED_TEST_DATA="false"
```

## 8. Hvordan koble til PostgreSQL

Opprett en database i PostgreSQL, for eksempel `bjork_bestilling`.

Deretter bruker du en PostgreSQL-tilkoblingsstreng i `DATABASE_URL`.

Format:

```env
DATABASE_URL="postgresql://BRUKERNAVN:PASSORD@HOST:PORT/DATABASENAVN?schema=public"
```

Lokalt er dette ofte:

```env
DATABASE_URL="postgresql://postgres:mittpassord@localhost:5432/bjork_bestilling?schema=public"
```

## 9. Installere avhengigheter

Kjør fra prosjektroten:

```powershell
npm install
```

Dette laster ned alle pakkene som står i `package.json`.

## 10. Prisma-migrasjoner lokalt

Først genererer du Prisma-klienten og oppretter databasen/tabellene:

```powershell
npm run db:migrate -- --name init
```

Hvis du allerede har migrasjoner og bare vil oppdatere databasen i produksjon, bruker du:

```powershell
npm run db:deploy
```

## 11. Opprette første administrator

Administrator opprettes ikke i kildekoden. I stedet bruker systemet disse miljøvariablene:

- `ADMIN_NAME`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Når de finnes i `.env`, kjører du:

```powershell
npm run db:seed
```

Dette gjør følgende:

- oppretter administrator hvis brukeren ikke finnes fra før
- hasher passordet med `bcrypt`
- setter rolle til `ADMIN`
- setter status til `APPROVED`
- overskriver ikke en administrator som allerede finnes

## 12. Valgfrie testdata

Hvis du vil opprette testdata lokalt, kjører du:

```powershell
npm run db:seed:test
```

Dette skriptet bruker `SEED_TEST_DATA=true` og oppretter:

- én administrator hvis miljøvariablene er satt
- to godkjente brukere
- én ventende bruker
- tre aktive produkter
- ett utsolgt produkt
- noen eksempelbestillinger

Testdata opprettes bare når du kjører den kommandoen.

## 13. Starte applikasjonen lokalt

For utvikling med automatisk omstart:

```powershell
npm run dev
```

For vanlig oppstart:

```powershell
npm start
```

Åpne nettleseren på:

[http://localhost:3000](http://localhost:3000)

## 14. Viktige scripts i `package.json`

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:generate": "prisma generate",
  "db:seed": "node prisma/seed.js",
  "db:seed:test": "cross-env SEED_TEST_DATA=true node prisma/seed.js",
  "test": "cross-env NODE_ENV=test node --test",
  "postinstall": "prisma generate"
}
```

## 15. Hvordan legge prosjektet på GitHub

Alle kommandoer under kjøres fra prosjektroten.

Initialiser Git hvis det ikke allerede er gjort:

```powershell
git init
```

Se hvilke filer som blir med:

```powershell
git status
```

Legg til alle prosjektfiler:

```powershell
git add .
```

Lag første commit:

```powershell
git commit -m "Første versjon av Bjørk Bestilling"
```

Opprett et tomt repository på GitHub, og koble det til lokalt prosjekt:

```powershell
git remote add origin https://github.com/DITT-BRUKERNAVN/DITT-REPO.git
git branch -M main
git push -u origin main
```

`.env` blir ikke lastet opp fordi den står i `.gitignore`.

## 16. Hvordan opprette Railway-prosjekt

1. Logg inn på [https://railway.app/](https://railway.app/)
2. Velg `New Project`
3. Velg `Deploy from GitHub repo`
4. Koble til GitHub-kontoen din
5. Velg repositoryet ditt

## 17. Hvordan legge til PostgreSQL på Railway

1. Åpne Railway-prosjektet
2. Velg `New`
3. Velg `Database`
4. Velg `PostgreSQL`

Railway oppretter da en `DATABASE_URL` som du kan bruke direkte.

## 18. Hvilke miljøvariabler du skal registrere i Railway

Legg inn disse i Railway:

- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_NAME`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NODE_ENV`
- `SESSION_COOKIE_NAME`

Anbefalte verdier:

- `NODE_ENV=production`
- `SESSION_COOKIE_NAME=bjork.sid`

Railway setter `PORT` automatisk. Applikasjonen bruker `process.env.PORT`, så du skal ikke hardkode port i Railway.

## 19. Startkommando på Railway

Railway kan bruke:

```text
npm start
```

## 20. Migrasjoner ved deploy på Railway

I produksjon skal du bruke `prisma migrate deploy`, ikke `prisma migrate dev`.

Du har to enkle alternativer:

1. Kjør migrasjonen manuelt i Railway shell:

```bash
npm run db:deploy
npm run db:seed
```

2. Legg til en egen deploy-kommando i Railway hvis du ønsker det i prosjektinnstillingene.

Anbefalt første gang:

```bash
npm run db:deploy
npm run db:seed
```

## 21. Hvordan Railway kobles til GitHub

Når Railway er koblet til GitHub-repoet ditt, vil nye pushes til hovedbranchen normalt trigge ny deploy automatisk.

Vanlig flyt senere:

```powershell
git add .
git commit -m "Beskriv endringen"
git push
```

## 22. Manuell testliste

Kontroller dette etter oppstart:

1. Registrer en ny bruker og bekreft at brukeren får status `PENDING`.
2. Prøv å registrere samme brukernavn på nytt og kontroller at du får feilmelding.
3. Prøv et passord på under 8 tegn og kontroller at det stoppes.
4. Logg inn som administrator og godkjenn en bruker.
5. Logg inn som brukeren og kontroller at innlogging fungerer.
6. Avslå en bruker og kontroller at vedkommende får riktig beskjed ved innlogging.
7. Deaktiver en bruker og kontroller at vedkommende mister tilgang.
8. Opprett et produkt.
9. Rediger produktet.
10. Sett produktet til `INACTIVE`, `SOLD_OUT` og `ARCHIVED`, og kontroller at bestilling stoppes.
11. Lag en bestilling som vanlig bruker.
12. Endre bestillingen.
13. Sett antall til `0` og kontroller at bestillingen fjernes.
14. Prøv negativt tall og kontroller at det stoppes.
15. Sett maks per bruker og kontroller at høyere antall avvises.
16. Sett lagergrense og kontroller at totalen ikke kan overstiges.
17. Åpne bestillingsoversikt for produkt og eksporter CSV.
18. Test mobilvisning i nettleserens utviklerverktøy.
19. Test 403, 404 og 500-sider.
20. Test Railway-deploy med miljøvariabler og database.

## 23. Automatiske tester

Kjør:

```powershell
npm test
```

Disse testene dekker enkel validering og tilgjengelighetslogikk. De er bevisst holdt små for å holde prosjektet nybegynnervennlig.

## 24. Feilsøking

Hvis `npm install` feiler:

- kontroller at Node.js er installert
- kjør `node -v` og `npm -v`

Hvis databasen ikke kobler til:

- kontroller `DATABASE_URL`
- sjekk at PostgreSQL kjører
- prøv å koble til databasen med et databaseverktøy

Hvis Prisma feiler:

```powershell
npm run db:generate
npm run db:migrate -- --name init
```

Hvis admin ikke blir opprettet:

- kontroller at `ADMIN_NAME`, `ADMIN_USERNAME` og `ADMIN_PASSWORD` finnes i `.env`
- kjør `npm run db:seed` på nytt

Hvis Railway viser 500-feil:

- kontroller at alle miljøvariabler finnes i Railway
- kjør `npm run db:deploy`
- kjør `npm run db:seed`
- se Railway-logger for detaljer

Hvis innlogging ikke holder seg etter deploy:

- kontroller at `SESSION_SECRET` er satt
- kontroller at databasen finnes
- kontroller at `NODE_ENV=production`

## 25. Sikkerhet som er implementert

- passord hashes med `bcrypt`
- sessions lagres i PostgreSQL
- session-cookies er `httpOnly`
- `secure` brukes i produksjon
- `sameSite=lax`
- `Helmet` er aktivert
- `CSRF` er aktivert
- `express-rate-limit` beskytter innlogging og registrering
- input trimmes og normaliseres
- Prisma bruker parameteriserte spørringer
- adminruter er beskyttet på serversiden
- sessions regenereres ved innlogging
- sessions destrueres ved utlogging

## 26. Hvorfor noen databasevalg er gjort

- `User` lagrer konto, rolle og godkjenningsstatus.
- `Product` lagrer produktdata, lagergrenser og status.
- `Order` kobler bruker og produkt sammen med antall.
- `Session` lagrer innlogginger i databasen.

Kombinasjonen av `userId` og `productId` er unik i `Order`. Det betyr at hver bruker bare kan ha én aktiv bestillingsrad per produkt.

Produkter og brukere slettes ikke ukritisk. Dette beskytter historikk og gjør løsningen tryggere i drift.

## 27. Hvordan legge til nye funksjoner senere

Hvis du senere vil utvide prosjektet, er dette en trygg arbeidsmåte:

1. legg databaseendringer i `prisma/schema.prisma`
2. kjør `npm run db:migrate -- --name beskriv_endringen`
3. legg logikk i `services`
4. legg HTTP-flyt i `controllers`
5. koble nye URL-er i `routes`
6. legg design i `views` og `public`
7. test lokalt før du pusher til GitHub

Eksempler på naturlige neste steg:

- e-postvarsler ved godkjenning
- global bestillingsoversikt på adminnivå
- bildeopplasting via Cloudinary
- bedre filtrering og paginering
- flere automatiske tester

## 28. Viktig før produksjon

Før du publiserer offentlig:

1. bytt alle eksempelpassord
2. bruk en sterk `SESSION_SECRET`
3. kontroller at `.env` ikke ligger i Git
4. kontroller at Railway-miljøvariabler er riktige
5. kjør `npm run db:deploy`
6. kjør `npm run db:seed`
