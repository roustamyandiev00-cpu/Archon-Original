# Archon Copilot — Architectuurbeslissing

## Centrale principe

Archon Copilot is de enige centrale AI-interface.
Alle AI-acties verlopen via Archon Copilot. Er zijn geen autonome agents die rechtstreeks en onbeperkt in de database werken.

## Gespecialiseerde agents (aangestuurd door Archon Copilot)

| Agent | Verantwoordelijkheid |
|---|---|
| CRM-agent | Contacten, klanten, leads |
| Documentagent | Offertes, facturen, sjablonen |
| Opvolgagent | Betalingsherinneringen, taken, deadlines |
| Netwerkagent | Bouwnetwerk, samenwerkingen *(v2)* |
| Inkoopagent | Leveranciers, inkoop *(v2)* |
| Analyseagent | Rapportages, KPI's *(v2)* |

## Regels voor alle agents

- Agents krijgen **geen directe onbeperkte databasetoegang**.
- Elke agent werkt uitsluitend via **vooraf gedefinieerde tools en permissies**.
- Financiële, juridische, externe communicatie- en moderatieacties vereisen **menselijke goedkeuring** vóór uitvoering.

## Agent-run logging

Elke uitvoering wordt opgeslagen als een `agent_run` met:

```
- organisatie
- gebruiker
- agent
- opdracht
- geraadpleegde bronnen
- voorgestelde acties
- goedkeuring (pending / approved / rejected)
- resultaat
- fouten
- tijdstip
```

## Versie 1 scope

Bouw alleen:
1. Archon Copilot (centrale interface)
2. CRM-agent
3. Documentagent
4. Opvolgagent

Netwerk-, inkoop- en analyseagents komen **pas nadat** offertes, projecten, facturen, contacten en rechten stabiel zijn.

## Waarom deze keuze

- Minder conflicten tussen agents
- Één centrale permissie- en goedkeuringslaag
- Duidelijk zichtbaar welke agent welke actie uitvoerde
- Eenvoudiger logging, debugging en kostencontrole
- Agents kunnen parallel werken zonder elkaar te overschrijven
