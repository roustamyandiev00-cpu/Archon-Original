# Plan: offerte-flow, onboarding en sidebar-gating

Status: **voltooid** (2026-07-16) — §1–§7 gedaan.
Datum: 2026-07-16.

## 1. Aanleiding en kernprobleem

Doel: elk bouwbedrijf moet kunnen registreren en meteen (mobiel-vriendelijk)
klanten en offertes kunnen aanmaken — met foto's van de werken, afmetingen en
een naam voor de werken — en dat moet doorwerken naar facturen en agents.

**Belangrijkste bevinding:** de kernbelofte "snel offerte maken via foto's en
afmetingen" bestaat al deels als UI (de Nova-wizard), maar deed inhoudelijk
niets. Foto's en afmetingen werden verzameld en daarna weggegooid in vrije
tekst; de AI gaf bij een foto altijd een harde error terug.

Losstaand, al eerder vastgesteld:
- ~~Build-blokkerende syntaxfout in AgentChatProvider~~ — **opgelost** (tsc groen).
- ~~Agent-naamgeving Lara/Nina vs Nova/Lima~~ — **stabiel**: backend IDs blijven
  Nova/Lima; Lara/Nina zijn UI-aliassen. Agent-tests (28) slagen.

## 2. Niet-doelen (expliciet buiten scope voor dit plan)

- Geen volledig nieuwe onboarding-wizard — de bestaande automatische
  provisioning werkt goed en hoeft niet herbouwd te worden (zie §5).
- Geen herontwerp van offerte→factuur-conversie — die logica
  (`convert-actions.ts`) werkt al volledig automatisch en hoeft niet te
  wijzigen.
- Geen per-tenant feature-flag-systeem optuigen — voor nu volstaat het
  bestaande statische `available`-veld per nav-item (zie §3).
- Geen volledige `agents-en-chatplatform-prd.md` (Fase 1–3) — aparte PRD.

## 3. Sidebar/nav afschermen (P0) — DONE

- `Audit` en `Telegram` in sidebar + mobile more met `available: false`
  ("Binnenkort beschikbaar").
- `E-Facturen` met `tag: "Beta"` (desktop + mobiel).
- Bestanden: `sidebar-nav.ts`, `nav-config.ts`, `Sidebar.tsx`, `MobileMoreSheet.tsx`.

## 4. Offerte-flow structureel maken

### 4.1 Projectnaam en afmetingen als structured data — DONE

- Kolommen `offertes.project_naam` en `offertes.afmetingen` (migratie
  `20260716_offertes_projectgegevens.sql`).
- `createOfferte` / `updateOfferte` schrijven deze velden.
- Nova-wizard stuurt `projectNaam` + `afmetingen` mee.
- Manueel `OfferteForm` toont/bewerkt deze velden.
- `projectNameFromOfferte` / project-aanmaak bij goedkeuring gebruiken
  `project_naam` als die gezet is.

### 4.2 Foto-upload vóór/tijdens offerte-aanmaak — DONE (staging)

- Client-side staging in `OfferteForm` (data-URLs) → bij submit
  `uploadOffertePhotosFromBase64`.
- Nova vision-upload opnieuw aan (§4.4a).

### 4.3 Inline nieuwe klant aanmaken — DONE

- "Nieuwe klant"-mini-form in `OfferteForm` → `createKlant` → `customer_id`
  meteen gekoppeld.

### 4.4 AI-fotoanalyse — DONE

- **(b)** Tijdelijk verbergen was tussenstap; nu weer aan.
- **(a)** Vision + m² × prijslijst:
  - `runVisionChatCompletion` / `getVisionRuntimeConfig` (OpenAI voorkeur,
    anders Groq vision).
  - `generateNovaOfferteDraft` multimodal; credit `offerte_draft_vision`.
  - `parseSquareMeters`, `enrichLinesWithPrijslijst`, `ensurePrijslijstM2Line`.
  - Nova UI: `ENABLE_OFFERTE_PHOTO_VISION = true`; stuurt foto's + afmetingen.

## 5. Onboarding-flow (P1) — DONE (OAuth-gat)

- `persistProfile()` bestond al vóór OAuth.
- Nieuw: `OnboardingSeedClient` in dashboard-layout +
  `applyOnboardingProfile` server action — past localStorage-onboarding toe
  na Google/Apple callback.

## 6. Mobiele bruikbaarheid offertelijnen (P1) — DONE

- Offertelijnen: compacte 2-koloms kaart op mobiel (`grid-cols-2` →
  `sm:grid-cols-12`), i.p.v. alles gestapeld op volle breedte.

## 7. Agent-koppeling (P2) — DONE

- `requestNovaOfferte` → `suggestOfferteFromPhotosAndDimensions` + prijslijst.
- Payload bevat `projectNaam` / `afmetingen`; proposal-reason vermeldt
  foto's/m²/prijslijst.
- Executor schrijft die velden door bij `create_offerte`.
- Agent-geheugen onthoudt projectnaam + afmetingen.

## 8. Volgorde-advies (stand van zaken)

1. ~~§3 sidebar-gating~~ done
2. ~~Build-fix + naamgeving~~ done
3. ~~§4.4(b) foto-upload verbergen~~ done (opgevolgd door 4.4a)
4. ~~§4.1–4.3 structured data, upload-staging, inline klant~~ done
5. ~~§4.4(a) echte fotoanalyse + m²-berekening~~ done
6. ~~§5 OAuth-onboarding-gat~~ done
7. ~~§6 mobiele layout~~ done
8. ~~§7 agent-koppeling~~ done
