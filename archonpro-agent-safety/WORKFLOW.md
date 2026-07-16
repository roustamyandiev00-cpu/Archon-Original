# Veilige dagelijkse workflow voor ArchonPro

Gebruik deze volgorde telkens wanneer je met Cursor of Kiro werkt.

## Voor je begint

1. Open altijd dezelfde lokale ArchonPro-repository.
2. Laat niet twee AI-agents tegelijk in dezelfde branch schrijven.
3. Controleer of je vorige werk gecommit en gepusht is.
4. Maak een kleine taakbranch, bijvoorbeeld `fix/login-redirect` of `feature/real-email-send`.
5. Geef één concrete taak met grenzen en acceptatiecriteria.

## Veilige opdracht voor Cursor of Kiro

Gebruik dit als starttekst en vul alleen de taak in:

> Lees eerst AGENTS.md en inspecteer de bestaande implementatie zonder bestanden te wijzigen. Controleer Git-status en behandel bestaande wijzigingen als gebruikerswerk. Taak: [VUL HIER ÉÉN TAAK IN]. Geef eerst diagnose, scope, verwachte bestanden, risico's en testplan. Verwijder, verplaats of hernoem niets. Maak geen duplicaten. Wijzig niets buiten deze taak. Voer na implementatie relevante lint-, typecheck-, test- en buildcontroles uit. Rapporteer exact wat gewijzigd is en wat nog onzeker blijft.

## Tijdens het werk

- Accepteer geen onverwachte projectbrede refactor.
- Stop wanneer de agent meer dan 10 bestanden wil wijzigen zonder duidelijke reden.
- Laat auth, database, migraties, betalingen of `.env` niet “even snel” aanpassen binnen een UI-taak.
- Start Kiro niet met schrijven zolang Cursor nog wijzigingen uitvoert, en omgekeerd.

## Na iedere taak

1. Bekijk de gewijzigde bestanden en controleer of ze bij de taak horen.
2. Laat typecheck, tests en indien nodig build uitvoeren.
3. Test de aangepaste flow zelf één keer.
4. Maak één duidelijke commit.
5. Push de branch als veilige externe kopie.
6. Begin pas daarna aan de volgende taak.

## Als iets stukgaat

- Start geen tweede agent die blind een brede reparatie uitvoert.
- Noteer de exacte fout, route en laatste werkende commit.
- Laat eerst diagnosticeren zonder wijzigingen.
- Herstel via een kleine nieuwe fix of draai alleen de problematische commit gecontroleerd terug.
- Verwijder nooit willekeurig mappen zoals `.next`, migraties of configuratie zonder te begrijpen waarom.

## Aanbevolen volgorde voor ArchonPro

1. Productiedomeinen, registratie en login.
2. Tenant-isolatie en server-side rollen/rechten.
3. Echte abonnementen en Stripe-webhooks.
4. Echte e-mailverzending en statusregistratie.
5. Klantportaal en digitaal offerteakkoord.
6. Facturatie en Belgische gestructureerde e-facturatie/Peppol.
7. Agenda, team en overige placeholders.
8. Pas daarna extra AI-agents en onderaannemersautomatisering.

