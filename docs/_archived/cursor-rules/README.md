# Gearchiveerde Cursor rules (uitgeschakeld)

Deze rules stonden in `.cursor/rules/` en zijn **bewust uitgeschakeld** omdat ze de agent te veel beperkten of tot fout gedrag leidden (bijv. alleen dashboard wijzigen, geen proactieve fixes).

Ze staan hier alleen als backup. **Niet** terugzetten naar `.cursor/rules/` tenzij je ze bewust opnieuw wilt activeren.

| Bestand | Probleem |
|---------|----------|
| `dashboard-focus.mdc` | `alwaysApply: true` — blokkeerde wijzigingen buiten dashboard |
| `no-unrequested-changes.mdc` | `alwaysApply: true` — te strikt, verhinderde nuttige fixes |
| `cobalt-design-system.mdc` | Design-constraints die botsten met huidige UI-werk |

Gearchiveerd op: 2026-07-11
