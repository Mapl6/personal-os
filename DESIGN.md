# DESIGN.md - Sistema de Monitoreo Eléctrico "WattVision"

## 1. Visual Theme & Atmosphere
El diseño debe transmitir **confiabilidad técnica** y **control**. No debe sentirse como una red social o una app de juegos. La interfaz está pensada para ser vista en una laptop o tablet en un entorno doméstico o de pequeño negocio en Bolivia. El ambiente es "Power BI Dashboard" pero simplificado para el usuario final.

## 2. Color Palette
- **Background Primario:** `#121212` (Dark Mode para eficiencia visual y resalte de datos).
- **Superficie de Tarjetas:** `#1E1E1E`.
- **Acento Primario (Datos):** `#00E5FF` (Cian/Neón) para gráficas, KPIs principales y botones de acción.
- **Acento de Alerta:** `#FF453A` (Rojo) para picos de consumo o alertas de "vampiro".
- **Acento Secundario:** `#32D74B` (Verde Lima) para estado "En vivo" o valores normales.
- **Texto Principal:** `#FFFFFF` (Alto contraste).
- **Texto Secundario:** `#98989D` (Gris para etiquetas).

## 3. Component Stylings
- **Tarjetas (Cards):** `border-radius: 16px`. Fondo `#1E1E1E`. Padding interno de `20px`. Borde sutil: `1px solid #2C2C2E`.
- **Gráficos (Charts):** Líneas de grid en `#2C2C2E`. Datos en `#00E5FF` con `#30D158` para gradientes de área. Sin líneas de borde gruesas.
- **Tablas:** Filas con `border-bottom: 1px solid #2C2C2E`. Hover sobre fila cambia fondo a `#252525`.
- **Alertas:** Caja con fondo `#3A1C1C`, texto rojo `#FF453A` y borde izquierdo de `4px solid #FF453A`.

## 4. Typography
- **Títulos:** Inter, Semi Bold, 24px.
- **Métricas KPIs (Watts, kWh, Bs):** JetBrains Mono o Fira Code (Fuente monoespaciada para números), Bold, 32px.
- **Cuerpo:** Inter Regular, 14px.

## 5. Layout Principles
- **Grid:** 12 columnas.
- **Espaciado:** Múltiplos de 8px (8px, 16px, 24px, 32px).
- **Dashboard:** Vista de 3 columnas (KPI, KPI, KPI) en la parte superior, Gráfico principal ocupando 8 columnas, Panel de Alertas ocupando 4 columnas en el lateral derecho.

## 6. Do's and Don'ts
- ✅ **Do:** Usar gráficos de área para suavizar picos de consumo.
- ✅ **Do:** Incluir la equivalencia en Bolivianos (`Bs.`) siempre junto al kWh.
- ❌ **Don't:** Usar colores pastel o fondos blancos (dificultan la lectura prolongada de datos).
- ❌ **Don't:** Usar iconos genéricos de "foco". Preferir iconos de "rayo", "enchufe" o "medidor".
---

## 7. Personal OS adaptation

Source: [designmd.ai — WattVision](https://designmd.ai/groquispe100inf-max/design-md-sistema-de-monitoreo-el-ctrico-wattvision) (MIT). Sections 1–6 above are the original. This section records how it maps onto Personal OS; tokens live in `src/app/globals.css`.

| Spec | Token / implementation |
| --- | --- |
| Background `#121212` | `--background` |
| Card surface `#1E1E1E`, border `#2C2C2E`, radius 16px, padding 20px | `--card`, `--border`, `rounded-xl` (16px), `Card` → `p-5` |
| Row hover `#252525` | `--accent` (hover surface for rows, menus, nav) |
| Data accent `#00E5FF` | `--primary` (default accent "cyan"); used for data, KPIs, primary actions, active nav |
| Alert `#FF453A` on `#3A1C1C`, 4px left border | `--danger`, `--danger-surface`, `<Alert>` component |
| Live / normal `#32D74B` | `--success` |
| Text `#FFFFFF` / `#98989D` | `--foreground` / `--muted-foreground` |
| Charts: grid `#2C2C2E`, data `#00E5FF`, area gradient to `#30D158` | `--chart-grid`, `--chart-1`, `--chart-2`; area charts over bars where a trend is shown |
| Titles Inter 600 24px · Body Inter 400 14px | `PageHeader` h1 `text-2xl font-semibold`, body `text-sm` |
| KPI numbers JetBrains Mono 700 32px | `Stat` value `font-mono text-[2rem] font-bold` |
| 12-column grid, 8px spacing | `grid-cols-12`; dashboard main `col-span-8`, side panel `col-span-4` |

Product-specific rules (Bs./kWh, lightning/plug icons) do not apply to a planner and are intentionally dropped.

Additional rules for Personal OS:
- Dark is the default. The light theme is kept as an option but uses grey surfaces (`#EEEEF0` / `#F7F7F8`), never pure white.
- Flat surfaces: no drop shadows on cards, no decorative gradients, no glows. Elevation comes from surface colour + border only (popovers/dialogs may keep one soft shadow).
- Cyan is a signal, not decoration: one primary action per view, data marks, the active nav item. Everything else is neutral.
- Sentence-case labels; no uppercase eyebrow text.
- Navigation is grouped into spaces (Home, Today, Plan, Tasks, Life, Insights). Pages inside a space are reached through the space's tab bar; every route still exists on its own.
- No eyebrow/kicker text above headings; context (dates, phase names) goes below the heading or beside it.
- Selected options in segmented controls are a neutral fill with a 1px inset cyan outline (`aria-checked`), never a solid cyan slab.
- No cards inside cards: inside a card, group with dividers (`divide-y`) or a single bordered `dl`.
- No progress rings; progress is a 4px bar under a KPI value.
- Text floor is 11px. Placeholders use `--muted-foreground` at full strength (≥4.5:1).
- Icons come from lucide only; never Unicode glyphs (▶, ✓) as icons.
- Progress bars animate `transform: scaleX`, never `width`.
