# TODO

## Neste oppgaver

- Koble `BETALT` og `HENTET` opp likt pa `admin/product-orders`, med samme async-flyt og uten refresh.
- Bytt popup-feil pa admin-bestillinger til liten inline-feilmelding i UI.
- Rydd bort midlertidige scripts som sannsynligvis ikke trengs videre:
  - `scripts/diagnose-railway-db.js`
  - `scripts/sync-local-products-to-railway.js`
- Oppdater `README.md` med produksjonslenker, custom domain og dagens bilde-strategi.
- Vurder om admin skal fa et enklere oppsett for manuell bilde-URL per produkt.
- Gå gjennom de `23` Tree House-produktene som fortsatt mangler trygg bildematch og avgjor om noen skal matches manuelt.
- Test custom domain `https://app.fredagschug.dedyn.io` i vanlig nettleser og bekreft at alt ser riktig ut uten sertifikat-/cache-avvik.
