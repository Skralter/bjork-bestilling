# Chat Context For Videre Arbeid

Denne filen oppsummerer status for prosjektet `BjorkBestilling` per 23. juli 2026 og skal brukes som arbeidsgrunnlag for videre endringer.

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
- Hvis det ikke finnes et sikkert produktbilde, skal appen vise `Produktbilde kommer` / plassholder i stedet for a gjette feil bilde.

## Viktige felter pa produkt

Produkter kan bruke disse feltene i flyten:

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

### Navigasjon og navn

- Venstre brukerfane heter `Ol`.
- Hoyre adminfane heter `Varer`.

## Bilder

Status na:

- Alle produktkort bruker fast bildestorrelse.
- Fallback-bilde brukes hvis vi ikke har sikkert bilde.

Det som er avklart:

- Untappd scraper brukes ikke.
- Untappd API brukes ikke.
- Tree House-lenken `https://orders.treehousebrew.com/oa/start-order?ml=d9kjvl6m8mrc31r7dbi7` kan ikke brukes fra dette miljoet, fordi siden svarer med `403` fra CloudFront.
- VPN i USA kan ikke brukes fra dette miljoet.

Anbefalt videre strategi for bilder:

- bruk manuell `imageUrl` nar vi har et sikkert bilde
- ellers bruk plassholder
- eventuell automatikk bor vaere konservativ og heller feile til plassholder enn a vise feil boks

## Deploy og produksjon

Appen er deployet pa Railway.

Viktige punkter:

- GitHub-repo: `https://github.com/Skralter/bjork-bestilling`
- Railway-app er oppe
- eksisterende offentlig Railway-URL:
  - `https://web-production-3e713.up.railway.app`

Lokale produkter er importert til Railway-databasen.

### Custom domain

Det er satt opp gratis DNS hos deSEC med:

- `fredagschug.dedyn.io`

Det er opprettet Railway custom domain som:

- `app.fredagschug.dedyn.io`

DNS-recordene hos deSEC ser riktige ut:

- `CNAME app -> 57hzq53v.up.railway.app.`
- `TXT _railway-verify.app -> "railway-verify=..."`

Men sist sjekket 23. juli 2026 var domenet fortsatt ikke synlig offentlig, og Railway viste fortsatt:

- `Waiting for DNS update`

Konklusjon na:

- oppsettet ser riktig ut
- problemet virker a vaere propagasjon/delegering, ikke feil input

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

## Viktige hensyn videre

- Ikke gjeninnfor `unit`, `maxPerUser` eller gamle felt i UI uten at brukeren ber om det.
- Ikke bryt async-lagringen pa produktsiden.
- Ikke fjern ankerlenkene som `Mine bestillinger` bruker.
- Vær konservativ med automatisk bildehenting.
- Bruk praktiske og direkte losninger; brukeren onsker lite friksjon.
