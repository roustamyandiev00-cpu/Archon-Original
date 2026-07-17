# ArchonPro — MVP-scope

Vaste productscope voor de eerste werkende versie. Agents en ontwikkelaars
houden zich hieraan tenzij de opdrachtgever expliciet afwijkt.

## Omgevingen

ArchonPro heeft voor deze MVP **exact twee actieve omgevingen**:

| Omgeving | Route | Gebruikers |
|---|---|---|
| **Platform-admin** | `/admin/*` | Interne ArchonPro-beheerders: bedrijven, gebruikers, pakketten, betalingen, AI-gebruik, feature flags, support, security en audit |
| **Klantenportaal** | `/dashboard/*` | Bouwbedrijven die ArchonPro gebruiken; iedere gebruiker ziet uitsluitend data van het eigen bedrijf (tenant) |

Er is **geen derde actieve omgeving**.

### Bevroren: `/portal/*`

Bestaande code voor eindklanten van bouwbedrijven onder `/portal/*`:

- niet verwijderen;
- niet verder ontwikkelen;
- later centraal verbergen of uitschakelen (bijv. feature flags).

## Actieve modules

1. **Contacten** — particulier en bedrijf; contact-, adres- en BTW-gegevens; tenant-isolatie
2. **Prijslijst** — materialen, werkuren en diensten; eenheid, prijs en btw-tarief; herbruikbaar in offertes en facturen
3. **Offertes** — gekoppeld aan contact; regels vanuit prijslijst; PDF, verzenden, status en digitaal akkoord
4. **Projecten** — aanmaken vanuit goedgekeurde offerte; klant, status, documenten en voortgang
5. **Agenda** — afspraken gekoppeld aan contact en eventueel project; aanmaken, wijzigen, voltooien en annuleren
6. **Facturen** — vanuit offerte of project; nummering, btw, PDF en betaalstatus; onderscheid B2C en Belgische B2B/Peppol
7. **Boekhouding-light** — inkomsten, uitgaven, betaalstatus, btw-overzicht, export voor boekhouder (geen volledige dubbele boekhouding of belastingaangifte)
8. **AI-agents** — ondersteunen de kernflow; voorstellen en opvolging; geen gevoelige acties zonder menselijke goedkeuring; alle acties loggen

## Kernflow

```
Contact + prijslijst → offerte → akkoord → project + agenda → factuur → boekhouding
```

## Bevroren modules

Niet verder ontwikkelen binnen de MVP (niet verwijderen, geen DB-tabellen
verwijderen, niet refactoren in andere taken):

- Bouwnetwerk
- Samenwerkingen
- Telegram
- Uitgebreide automatisaties
- Overige experimentele modules
- `/portal/*` (zie boven)

Alleen aanpassen wanneer aantoonbaar nodig voor build-, security- of
regressieproblemen.

## Veiligheid

- **Autorisatie en tenant-isolatie** gebeuren server-side. Alleen menu-items
  verbergen is geen beveiliging.
- **AI-acties met impact** (financieel, juridisch, externe communicatie,
  moderatie) vereisen menselijke goedkeuring vóór uitvoering.
