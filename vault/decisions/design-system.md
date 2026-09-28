---
status: stable
code_path: Frontend/app/globals.css
---

> **Otros archivos relacionados** (sin tracking en `code_path` por limitación del script):
> `Frontend/components/custom/theme-provider.tsx`,
> `Frontend/components/custom/dark-light-toggle.tsx`,
> `Frontend/components/layout/header-public.tsx`,
> `Frontend/components/layout/header-private.tsx`,
> `Frontend/app/(public)/login/page.tsx`

# Design System — FarMedic

**Qué**: Sistema visual basado en shadcn/ui (Radix base, preset Nova) con paleta de marca propia.
**Por qué**: Identidad farmacéutica (teal saludable + azul profesional confiable), accesibilidad por defecto, themeables via CSS variables.

## Colores de marca

| Token | Hex | OKLCH light | OKLCH dark | Uso |
|-------|-----|-------------|------------|-----|
| `brand` | `#14A67C` | `oklch(0.62 0.13 170)` | `oklch(0.72 0.13 170)` | Acción primaria, identidad principal |
| `brand-secondary` | `#07598C` | `oklch(0.43 0.10 240)` | `oklch(0.62 0.13 240)` | Énfasis secundario, info, links |

**Regla clave**: `--primary` está mapeado a `--brand`, por lo que **todos los componentes shadcn** (`Button`, `Switch`, etc.) heredan brand teal automáticamente. Para uso explícito existen utilidades Tailwind: `bg-brand`, `text-brand`, `border-brand`, y sus variantes `-secondary` y `-foreground`.

## Filosofía cromática

- **Predominante**: escala de grises neutros (light) o gris-azulado oscuro (dark)
- **Acentos**: brand teal para CTAs y selección, brand deep blue para secundarios
- **Light**: fondo blanco puro `oklch(1 0 0)`, foreground casi-negro con tinte sutil azulado
- **Dark**: fondo `oklch(0.18 0.015 240)` (dark blue-gray, no neutro puro) para cohesión con `brand-secondary`
- **No saturar**: brand para destacar, mayoría de la UI en grises

## Decisiones técnicas

| Aspecto | Valor |
|---------|-------|
| Library | shadcn/ui |
| Base | Radix UI |
| Preset | radix-nova |
| Icon library | `lucide-react` (única librería en todo el proyecto) |
| Fuente sans | `Poppins` (400, 500, 600, 700, 800) via `next/font/google` |
| Fuente mono | `Geist Mono` |
| CSS variables | true |
| Theme path | `Frontend/app/globals.css` |
| Dark mode | clase `.dark` en `<html>`, variant `&:is(.dark *)` |
| RSC | true |

## Aliases de import

Definidos en `Frontend/tsconfig.json` (`@/* → ./*`) y `Frontend/components.json`:

| Alias | Apunta a |
|-------|----------|
| `@/components` | `Frontend/components/` |
| `@/components/ui` | `Frontend/components/ui/` |
| `@/lib` | `Frontend/lib/` |
| `@/lib/utils` | `Frontend/lib/utils.ts` (exporta `cn`) |
| `@/hooks` | `Frontend/hooks/` |

**Regla**: preferir alias `@/...` sobre rutas relativas.

## Tipografía

Fuente **Poppins** cargada vía `next/font/google` con variable CSS `--font-poppins`, mapeada a `--font-sans` en el tema.

Escala semántica como utilidades en `@layer utilities` — usar como clase: `<h1 className="h1">`.

| Clase | Tamaño | Peso | line-height | Uso |
|-------|--------|------|-------------|-----|
| `.h1` | 2.25rem (36px) | 800 | 1.2 | Títulos de página |
| `.h2` | 1.75rem (28px) | 700 | 1.3 | Secciones |
| `.h3` | 1.375rem (22px) | 600 | 1.4 | Subsecciones |
| `.h4` | 1.125rem (18px) | 600 | 1.4 | Card titles |
| `.body` | 1rem (16px) | 400 | 1.6 | Texto base |
| `.small` | 0.875rem (14px) | 500 | 1.5 | Labels destacados |
| `.xs` | 0.75rem (12px) | 400 | 1.4 | Metadatos, helper text |

Letter-spacing leve negativo en `h1` y `h2` para mejor compactación.

## Paleta de Charts (8 colores)

Para el módulo de Reportes. Light theme con cromas medias sobre blanco; Dark theme con luminosidad mayor para destacar sobre fondo oscuro.

| Token | Rol sugerido |
|-------|--------------|
| `chart-1` | Serie principal / brand teal |
| `chart-2` | Serie secundaria / brand deep blue |
| `chart-3` | Ingresos / atención (warm orange) |
| `chart-4` | Categoría adicional (purple-pink) |
| `chart-5` | Categoría adicional (yellow-green) |
| `chart-6` | Pérdidas / negativo (coral red) |
| `chart-7` | Contexto (cyan) |
| `chart-8` | Categoría adicional (violet) |

## UI Primitives

33 componentes shadcn instalados. Inventario en vivo: `.vault-sync/facts.json::frontend.ui_primitives`.

Para agregar uno nuevo:
```bash
cd Frontend && npx shadcn@latest add <component>
```
Tras instalar, correr `/sync` para que el grafo registre el nuevo primitive.

## Reglas de uso

1. **No hardcodear colores** — siempre tokens (`bg-background`, `text-foreground`, `bg-primary`, `bg-brand`, etc.)
2. **No mezclar librerías de íconos** — solo `lucide-react`
3. **No reescribir componentes shadcn** — la base es buena; ajustar via CSS variables si hace falta
4. **Tipografía**: usar `.h1` `.h2` etc. en lugar de `text-4xl font-extrabold` para garantizar consistencia
5. **Brand sparingly**: la mayoría de la UI en grises; brand para destacar

## Relaciones

[[stack]] [[arquitectura]]

## Implementación de dark/light mode
El theme provider está en `components/custom/theme-provider.tsx` (wrapper de `next-themes`). Se monta una vez en `app/layout.tsx` con `attribute="class"`, `defaultTheme="system"`, `enableSystem` y **`disableTransitionOnChange`**.

El toggle (`components/custom/dark-light-toggle.tsx`) usa `useTheme().resolvedTheme` y switche entre `"light"` y `"dark"`. Muestra `Moon` cuando está claro y `Sun` cuando está oscuro — el ícono representa el destino al hacer clic.

El `<html>` lleva `suppressHydrationWarning` porque `next-themes` modifica la clase antes del hidrate.

### Animación de cambio de tema — View Transitions API

El crossfade global durante el toggle se hace con `document.startViewTransition()` (no con reglas CSS universales sobre `*`). El browser captura un snapshot del DOM en estado viejo, ejecuta el cambio de tema dentro del callback y funde la frame nueva. Beneficios:

- **No introduce lag en hovers individuales** (no toca `transition-duration` de ningún elemento).
- **No interfiere con `disableTransitionOnChange`** de next-themes (que sigue activo).
- **Fallback automático**: si el browser no soporta `startViewTransition`, el cambio es instantáneo (degrada limpio).
- Honra `prefers-reduced-motion: no-preference` — la animación solo corre si el usuario no pidió reducir movimiento.

CSS:
```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 300ms;
    animation-timing-function: ease-in-out;
  }
}
```

**Antipattern**: aplicar `* { transition: bg, color, border 300ms }` ralentiza todos los hovers y degrada performance. No usar.

## Navegación — estado activo

`HeaderPublic` y `HeaderPrivate` (`Frontend/components/layout/header-*.tsx`) detectan ruta activa con `usePathname()` y aplican:

| Estado | Clases |
|--------|--------|
| Activo | `text-primary font-semibold` + `aria-current="page"` |
| Inactivo | `text-foreground/70` |
| Hover | `text-primary` (transición `transition-colors duration-200`) |

**Regla**: usar `transition-colors` (no `transition-all`) para evitar que se intente animar propiedades discretas como `font-weight`, que no son animables y causan layout-shift.

## Login page — banner animado

`Frontend/app/(public)/login/page.tsx` muestra un banner a la izquierda (≥ md) con:

- Imagen `next/image` (`/banner.jpg`, `fill`, `priority`, `object-cover object-left`).
- Animación `ken-burns` (zoom + traslación suave, 20s loop) — utilidad CSS expuesta en `globals.css`:
  ```css
  @keyframes ken-burns { 0% { transform: scale(1) translateX(0); } 50% { transform: scale(1.05) translateX(-10px); } 100% { transform: scale(1) translateX(0); } }
  .animate-ken-burns { animation: ken-burns 20s ease-in-out infinite; }
  ```
- Tres capas de overlay: blur progresivo con `[mask-image:linear-gradient(...)]`, tinte de fondo `bg-background/20`, gradiente final `bg-gradient-to-r from-transparent via-background/20 to-background` para fusionar con la columna del formulario.

## Print - comprobante POS (commit c3bfaa3, 2026-05-16)
`Frontend/app/globals.css` gano un bloque `@media print` para soportar la impresion del comprobante de venta desde `pos-comprobante-dialog.tsx` (placeholder de RF-08 mientras no haya PDF real).

**Estrategia**: oculta el chrome de la app y el overlay del `Dialog` shadcn, deja visible solo el contenedor con `id="pos-comprobante-printable"` que vive dentro del DialogContent (portal). Selectores usados:

- `body > *:not(:has(#pos-comprobante-printable))` - oculta hermanos del nodo del portal.
- `[data-slot="dialog-overlay"]` - oculta el backdrop del Dialog.
- `[data-slot="dialog-content"]` - neutraliza `position/transform/box-shadow/border/padding/max-width` para que el comprobante imprima como documento normal.
- `#pos-comprobante-printable` - fuerza `color: #000` y `font-size: 11pt` (compatible con receipt 80mm cuando el browser respeta el page size).

La funcion `window.print()` se invoca desde el boton "Imprimir" del dialogo. No requiere dependencias extra. Cuando entre el PDF real (DOMPDF o Browsershot), esta seccion queda como fallback hasta que se borre el bloque print.
