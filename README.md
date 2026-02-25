# Geschenke-Manager PoC

[![CI](https://github.com/ChristinaSporer/poc_wunschliste/actions/workflows/ci.yml/badge.svg?branch=trunk)](https://github.com/ChristinaSporer/poc_wunschliste/actions/workflows/ci.yml?query=branch%3Atrunk)

Proof-of-Concept als Web-App für eine Person (kein Login).

Stack:
- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- Minimales UI mit plain CSS/HTML

## Seiten

- `/dashboard` Übersicht (Personen, Ideen, Geburtstage)
- `/people` Personenliste + Anlegen/Löschen
- `/people/[id]` Personendetail + Ideen verwalten
- `/print` Druckansicht (nur offene Ideen)
- `/share/[token]` Read-only Share-Seite pro Person (nur Ideen)

## API-Routen

- `GET/POST /api/people`
- `GET/PATCH/DELETE /api/people/[id]`
- `GET/POST /api/people/[id]/ideas`
- `PATCH/DELETE /api/ideas/[id]`
- `GET /api/share/[token]`

## Lokale Entwicklung

1. Abhängigkeiten installieren:

```bash
npm install
```

2. `DATABASE_URL` in `.env` setzen (PostgreSQL, z. B. Neon):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

3. Datenbank-Schema anwenden:

```bash
npm run db:push
```

4. Demo-Daten einspielen (4 Personen + mehrere Ideen):

```bash
npm run db:seed
```

5. Dev-Server starten:

```bash
npm run dev
```

App läuft unter `http://localhost:3000`.

## Deployment

Deployment-Ziel ist Vercel mit PostgreSQL (z. B. Neon) für persistente Daten.

In Vercel setzen:
- Environment Variable `DATABASE_URL` mit deiner Postgres-Connection-URL
- Build Command: `npm run vercel-build`

## Tests

Unit-Tests ausführen:

```bash
npm run test
```

API-Integrationstests ausführen (echte HTTP-Calls gegen lokale Next-App):

```bash
# separate Test-Datenbank verwenden
$env:DATABASE_URL_TEST="postgresql://USER:PASSWORD@HOST/DB_TEST?sslmode=require"
npm run test:integration
```

Hinweise:
- Die Integrationstests starten die App auf `http://127.0.0.1:4010`.
- Vor dem Lauf wird die Test-Datenbank per `prisma migrate reset --force` zurückgesetzt.
- Ohne `DATABASE_URL_TEST` werden die Integrationstests automatisch übersprungen.

## Demo-Smoketest

Voraussetzung:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Klickpfad

1. `http://localhost:3000` öffnet `dashboard`.
2. Auf `Personen` wechseln und prüfen, dass 4 Seed-Personen sichtbar sind.
3. Bei einer Person `Share-Link` öffnen und prüfen:
	- Nur offene Geschenkideen sichtbar
	- Keine Geburtstage, Notizen oder vergangene Geschenke sichtbar
4. Zurück in `Personen`: neue Person anlegen.
5. Neue Person öffnen (`/people/[id]`) und eine Idee hinzufügen.
6. Idee auf `Als verschenkt markieren` setzen und prüfen, dass sie im Share-Link nicht mehr erscheint.
7. Seite `Drucken` öffnen und `Drucken` klicken; nur offene Ideen werden angezeigt.

### Beispiel-API-Calls (PowerShell)

Personen abrufen:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/people"
```

Person anlegen:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/people" -ContentType "application/json" -Body '{"name":"Eva Test","birthday":"1994-07-15","notes":"API Smoke"}'
```

Idee für Person mit ID 1 anlegen:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/people/1/ideas" -ContentType "application/json" -Body '{"title":"Test-Idee","description":"Per API","status":"IDEA"}'
```

Share-Endpoint testen (Token aus `/api/people`):

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/share/<TOKEN>"
```
