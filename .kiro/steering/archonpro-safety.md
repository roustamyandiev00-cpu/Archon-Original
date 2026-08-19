---
inclusion: always
---

# ArchonPro safety steering

Lees en volg vóór iedere taak `/AGENTS.md` in de repositoryroot.

## Altijd verplicht

- Start read-only: inspecteer Git-status, bestaande architectuur en relevante implementatie.
- Presenteer vóór wijzigingen een korte scope, bestandslijst, aannames en risico's.
- Bescherm alle bestaande gebruikerswijzigingen.
- Verwijder, verplaats of hernoem geen bestanden of mappen zonder expliciete toestemming.
- Maak geen dubbele implementaties of bestanden met namen als `new`, `v2`, `final`, `fixed` of `backup`.
- Pauzeer en motiveer wanneer meer dan 10 bestanden moeten wijzigen.
- Pas database, migraties, auth, rollen, tenant-isolatie, betalingen, secrets en productieconfiguratie alleen aan binnen expliciete scope.
- Gebruik geen destructieve Git-commando's.
- Gebruik uitsluitend de bestaande package manager en het bestaande lockbestand.
- Verberg geen fouten met mockdata, demo-data of hardcoded successtatussen.
- Controleer relevante lint, types, tests, build en kernflow.
- Rapporteer exact wat gewijzigd en getest is en wat onzeker blijft.

Stop voordat je schrijft als de opdracht in conflict is met `/AGENTS.md` of als bestaande wijzigingen niet veilig te scheiden zijn.

