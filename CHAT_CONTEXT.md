# Chat Context For Videre Arbeid

Denne filen oppsummerer status for prosjektet `BjorkBestilling` per fredag 24. juli 2026 og skal brukes som arbeidsgrunnlag for videre endringer.

## Prosjekt

Appen er en bestillingsapp for ol med:

- Node.js
- Express
- EJS
- PostgreSQL
- Prisma
- session-lagring i PostgreSQL
- CSRF-beskyttelse
- Railway-deploy

## Viktige produktregler

- Alle produkter er ol.
- Alle priser skal tolkes som `pris per stk`.
- Hvis et produkt sier `4-pack` eller lignende, betyr det at produktet ma bestilles i et fast trinn, for eksempel `4`.
- Hvis det ikke finnes et sikkert produktbilde, skal appen vise plassholder i stedet for a gjette feil bilde.

## Viktige felter pa produkt

Produkter bruker disse feltene i flyten:

- `breweryName`
- `name`
- `description`
- `imageUrl`
- `imageAttribution`
- `price`
- `status`
- `orderDeadline`
- `orderStep`
- `totalAvailableQuantity`

Felter som ikke skal tilbake i vanlig UI uten eksplisitt onske:

- `unit`
- `maxPerUser`
- manuell `sortOrder`

## Ferdig bygget i appen

### Auth og sessions

- Innlogging, registrering og admin-godkjenning fungerer.
- Prisma session store fungerer.
- Logout-krasj ble fikset ved redirect til `/auth/login?loggedOut=1`.
- CSRF-problem ved login og bestillingslagring ble fikset.

### Produktside for bruker

Dette fungerer na:

- filter pa bryggeri
- sortering pa `Nyeste forst` og `Alfabetisk`
- typeahead-sokefelt til hoyre for `Sortering`
- sok filtrerer mens brukeren skriver
- kort og bilder holder fast storrelse ogsa nar bare ett treff star igjen
- lagring av bestilling uten side-refresh
- filter og scrollposisjon beholdes ved lagring
- visning av `Ditt antall na`
- visning av `Bestilt totalt av alle`
- forklaring om at pris er per stk

### Mine bestillinger

- Produktnavn er klikkbart.
- Lenken gar til riktig produktkort pa produktsiden.

### Admin

Dette fungerer na:

- opprette produkt
- redigere produkt
- masseinnlegg via liste
- slette produkter selv om de har bestillinger
- klikk fra admin-listen rett inn pa redigering av valgt produkt
- egen oppsummeringsside for bestillinger per bruker og per produkt
- typeahead-sok pa `/admin/products`

### Navigasjon og navn

- Venstre brukerfane heter `Ol`.
- Hoyre adminfane heter `Varer`.

## Bilder

Status na:

- Alle produktkort bruker fast bildestorrelse.
- Fallback-bilde brukes hvis vi ikke har sikkert bilde.
- Tree House-bilder er importert lokalt og deployet til produksjon.
- Produksjonsdatabasen er oppdatert med lokale bildebaner for treff.

Resultat fra Tree House-import:

- `38` produkter fikk bilde i produksjon
- `23` produkter ble staende uten trygg match og bruker fortsatt plassholder

Det som er avklart:

- Untappd scraper brukes ikke.
- Untappd API brukes ikke.
- Tree House-lenken `https://orders.treehousebrew.com/oa/start-order?ml=d9kjvl6m8mrc31r7dbi7` kan ikke brukes fra dette miljoet, fordi siden svarer med `403` fra CloudFront.
- VPN i USA kan ikke brukes fra dette miljoet.

Anbefalt videre strategi for bilder:

- bruk manuell `imageUrl` nar vi har et sikkert bilde
- ellers bruk plassholder
- eventuell automatikk bor vaere konservativ og heller feile til plassholder enn a vise feil bilde

## Deploy og produksjon

Appen er deployet pa Railway.

Viktige punkter:

- GitHub-repo: `https://github.com/Skralter/bjork-bestilling`
- Railway standard-URL:
  - `https://web-production-3e713.up.railway.app`
- Railway custom domain:
  - `https://app.fredagschug.dedyn.io`

Lokale produkter er importert til Railway-databasen.

### Custom domain

Det er satt opp gratis DNS hos deSEC med:

- `fredagschug.dedyn.io`

Det er opprettet Railway custom domain som:

- `app.fredagschug.dedyn.io`

Railway viser na domenet som aktivt i status-output. Tidligere DNS-venting er derfor ikke lenger hovedstatus.

Merk:

- Railway-status bruker na `app.fredagschug.dedyn.io`
- standard Railway-domenet `web-production-3e713.up.railway.app` fungerer fortsatt og er nyttig ved testing

## Hjelpefiler og drift

- `restart-server.bat` finnes for enkel restart av lokal server
- `CHAT_CONTEXT.md` er hovedkontekst for videre arbeid
- `TODO.md` er kort liste over neste oppgaver

## Filer som er sentrale videre

- `prisma/schema.prisma`
- `prisma/seed.js`
- `src/app.js`
- `src/controllers/authController.js`
- `src/controllers/productController.js`
- `src/controllers/adminController.js`
- `src/services/orderService.js`
- `src/services/productService.js`
- `src/views/products/index.ejs`
- `src/views/products/my-orders.ejs`
- `src/views/admin/products.ejs`
- `src/views/admin/product-form.ejs`
- `src/views/admin/bulk-products.ejs`
- `src/views/admin/orders-summary.ejs`
- `src/views/partials/header.ejs`
- `public/js/app.js`
- `public/css/styles.css`
- `public/images/products/treehouse/`
- `scripts/import-treehouse-images.js`

## Midlertidige eller uklare filer

Det ligger fortsatt noen hjelpefiler i repo/worktree som bor vurderes:

- `scripts/diagnose-railway-db.js`
- `scripts/sync-local-products-to-railway.js`

De er ikke en del av den vanlige appflyten og kan sannsynligvis ryddes bort senere hvis de ikke trengs mer.

## Viktige hensyn videre

- Ikke gjeninnfor `unit`, `maxPerUser` eller gamle felt i UI uten at brukeren ber om det.
- Ikke bryt async-lagringen pa produktsiden.
- Ikke fjern ankerlenkene som `Mine bestillinger` bruker.
- Vaer konservativ med automatisk bildehenting.
- Bruk praktiske og direkte losninger; brukeren onsker lite friksjon.
- Ved framtidige deployer: ikke endre brukere, produkter eller data i databasen med mindre brukeren spesifikt ber om det. Vanlige deployer skal som standard bare rulle ut kode-, UI- og statiske filendringer.
