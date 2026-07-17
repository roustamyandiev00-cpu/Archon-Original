# ArchonPro — verplichte werkinstructies voor AI coding agents

Deze regels gelden voor iedere AI-agent die in deze repository werkt, waaronder Cursor, Kiro, Codex en andere coding assistants.

## 1. Hoofddoel

Werk ArchonPro gecontroleerd af zonder bestaande functionaliteit, gebruikersdata, tenant-isolatie of projectstructuur te beschadigen.

Veiligheid en een werkende kernflow hebben voorrang op nieuwe modules, grote refactors en visuele vernieuwingen.

## 2. Projectcontext

Vóór productwerk: lees ook `docs/MVP_SCOPE.md` voor de vaste MVP-scope,
actieve modules en bevroren onderdelen.

ArchonPro is een multi-tenant SaaS-platform voor Belgische bouwbedrijven met onder andere:

- klanten en contacten;
- offertes, facturen en PDF-documenten;
- projecten en documenten;
- klantportaal;
- rollen en rechten;
- abonnementen en betalingen;
- AI-ondersteuning en opvolging;
- Supabase/database-integratie.

Waarschijnlijke stack: Next.js App Router, React, TypeScript, Tailwind, shadcn/ui, Supabase/Drizzle, Stripe, e-mailprovider en Vercel. Controleer de werkelijke repository voordat je aannames over de stack gebruikt.

## 3. Verplichte startcontrole

Voer vóór iedere wijziging eerst een read-only inventarisatie uit:

1. Lees deze `AGENTS.md` en eventuele lokale instructiebestanden.
2. Controleer de huidige Git-branch en `git status`.
3. Meld bestaande gewijzigde of niet-gevolgde bestanden. Behandel ze als werk van de gebruiker.
4. Zoek de bestaande implementatie, routes, componenten, services, database-tabellen en tests die bij de taak horen.
5. Controleer welk package-managementsysteem al wordt gebruikt aan de hand van het bestaande lockbestand.
6. Controleer of dezelfde functie al elders bestaat voordat je een nieuw bestand maakt.
7. Geef vóór implementatie een kort plan met:
   - doel en scope;
   - bestanden die waarschijnlijk veranderen;
   - risico's en aannames;
   - controles die na afloop worden uitgevoerd.

Begin niet blind te wijzigen wanneer de gevraagde functie, bron van waarheid of datamodel onduidelijk is.

## 4. Scope en wijzigingslimieten

- Werk aan één afgebakende taak per keer.
- Gebruik bestaande architectuur, patronen en componenten.
- Maak geen tweede implementatie van een bestaande pagina, service, hook, component of databasefunctie.
- Houd de wijziging zo klein mogelijk. Bij meer dan 10 gewijzigde bestanden: pauzeer en leg uit waarom dit nodig is.
- Voer geen projectbrede cleanup, formattering, dependency-upgrade of refactor uit binnen een gewone feature- of bugfix.
- Los geen ongerelateerde problemen op zonder ze eerst afzonderlijk te melden.
- Voeg geen nieuwe module, agent, integratie of database-entiteit toe buiten de expliciete opdracht.

## 5. Bestanden en mappen

Zonder expliciete toestemming van de gebruiker is het verboden om:

- bestanden of mappen te verwijderen;
- bestanden of mappen te verplaatsen of hernoemen;
- routes te verplaatsen of routegroepen te herstructureren;
- bestaande publieke exports te wijzigen;
- duplicaten zoals `new`, `final`, `fixed`, `v2` of `backup` aan te maken;
- gegenereerde code of grote aantallen bestanden toe te voegen;
- de volledige mapstructuur te reorganiseren.

Als verplaatsen of verwijderen echt noodzakelijk is, toon dan eerst:

1. het exacte oude en nieuwe pad;
2. alle imports, routes en tests die geraakt worden;
3. het migratie- of herstelplan;
4. waarom aanpassen op de bestaande locatie niet volstaat.

## 6. Git-veiligheid

- Werk bij voorkeur op een taakgerichte branch, niet rechtstreeks op de productiebranch.
- Verwijder, overschrijf, stash of revert nooit wijzigingen van de gebruiker.
- Gebruik nooit destructieve Git-commando's zoals `git reset --hard`, geforceerde checkout of geforceerde push.
- Commit geen `.env`-bestanden, tokens, wachtwoorden, sleutels of klantgegevens.
- Maak logische, kleine commits: één werkende taak per commit.
- Push, merge, deploy of open geen pull request tenzij de gebruiker dat expliciet vraagt.
- Als Cursor en Kiro dezelfde repository gebruiken, mag slechts één agent tegelijk schrijven. Parallel werk vereist aparte branches of Git worktrees.

## 7. Dependencies en configuratie

- Gebruik uitsluitend de package manager die bij het bestaande lockbestand hoort.
- Maak geen tweede lockbestand aan.
- Installeer, verwijder of upgrade geen dependency zonder noodzaak en zonder dit vooraf te melden.
- Wijzig geen framework-, TypeScript-, lint-, build-, deployment- of Tailwind-configuratie om een lokale fout te verbergen.
- Wijzig `.env`, `.env.local` en productievariabelen nooit automatisch.
- Nieuwe variabelen worden alleen toegevoegd aan het voorbeeldbestand, zonder echte geheime waarde, en worden gedocumenteerd.

## 8. Database, Supabase en migraties

Databasewijzigingen zijn hoog risico.

- Controleer eerst het bestaande schema, migraties, relaties, policies en gebruik in de applicatie.
- Herschrijf of verwijder nooit een migratie die mogelijk al is uitgevoerd.
- Maak voor schemawijzigingen een nieuwe, voorwaartse migratie.
- Voer geen destructive migration, dataverwijdering of productiequery uit zonder expliciete toestemming en herstelplan.
- Gebruik geen service-role key in browser- of clientcode.
- Iedere tenantgebonden query moet server-side tenantcontrole en waar van toepassing RLS hebben.
- Vertrouw nooit alleen op een verborgen knop of client-side rolcontrole voor autorisatie.
- Controleer bij rollen en rechten zowel lezen als schrijven, directe URL-toegang en API/server actions.
- Gebruik geen echte klantdata als testdata.

## 9. Authenticatie, betalingen en communicatie

Voor auth, Stripe, abonnementen, AI-credits, e-mail, klantportaal en facturatie geldt:

- Geen mockbetaling, nep-successtatus of placeholder presenteren als productiefunctionaliteit.
- Stripe-status wordt server-side en via geverifieerde webhooks bepaald.
- E-mailstatus mag pas `sent` worden na bevestiging van de provider.
- Wachtwoorden en SMTP-gegevens worden nooit plaintext opgeslagen.
- Publieke portaal- en offertelinks gebruiken beperkte, vervalbare en controleerbare toegang.
- Gevoelige acties krijgen autorisatie, validatie, idempotentie en logging.
- Facturatie moet het verschil tussen PDF en gestructureerde Belgische B2B e-facturatie respecteren; claim geen Peppol-ondersteuning zonder echte end-to-end integratie.

## 10. UI en routes

- Respecteer de bestaande App Router-structuur en routeconventies.
- Maak geen parallelle login-, dashboard-, offerte- of factuurflow.
- Hergebruik bestaande design tokens en shadcn/componentpatronen.
- Controleer desktop en mobiel.
- Voorzie loading, empty, error, disabled, success en permission-denied states waar relevant.
- Verberg fouten niet met demo-data of hardcoded fallbackdata.

## 11. Verplichte kwaliteitscontrole

Gebruik de bestaande scripts uit `package.json`; verzin geen commando's die het project niet kent.

Voer na implementatie, waar beschikbaar, minimaal uit:

1. formatter/lint voor de geraakte bestanden;
2. TypeScript/typecheck;
3. relevante unit- en integratietests;
4. productiebuild bij route-, configuratie- of brede wijzigingen;
5. relevante end-to-end flow of gerichte handmatige controle.

Een bestaande fout buiten de scope mag niet stil worden opgelost of verborgen. Meld duidelijk:

- welke controle slaagde;
- welke controle faalde;
- of de fout al bestond of door de wijziging ontstond;
- wat nog niet getest kon worden.

## 12. Definitie van klaar

Een taak is pas klaar wanneer:

- de gevraagde functie werkelijk werkt en geen placeholder is;
- bestaande kernflows niet zijn gebroken;
- autorisatie en tenant-isolatie gecontroleerd zijn indien relevant;
- loading-, empty-, error- en success-states behandeld zijn;
- relevante tests en typechecks slagen;
- geen secrets of echte klantdata zijn toegevoegd;
- de agent een overzicht geeft van gewijzigde bestanden, controles, risico's en resterend werk.

## 13. Verplicht eindrapport

Sluit iedere taak af met:

1. **Resultaat** — wat nu werkelijk werkt.
2. **Gewijzigde bestanden** — exact overzicht met reden per bestand.
3. **Database/configuratie** — migraties, variabelen of handmatige stappen.
4. **Controles** — lint, typecheck, tests, build en handmatige verificatie.
5. **Openstaand** — beperkingen, risico's en volgende logische stap.

Zeg nooit dat iets volledig klaar of veilig is als de relevante controle niet kon worden uitgevoerd.

