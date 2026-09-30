---
name: WeOne
colors:
  surface: '#12131c'
  surface-dim: '#12131c'
  surface-bright: '#383843'
  surface-container-lowest: '#0d0d17'
  surface-container-low: '#1a1b25'
  surface-container: '#1e1f29'
  surface-container-high: '#292934'
  surface-container-highest: '#34343f'
  on-surface: '#e3e1ef'
  on-surface-variant: '#c5c5d9'
  inverse-surface: '#e3e1ef'
  inverse-on-surface: '#2f303a'
  outline: '#8f8fa2'
  outline-variant: '#454556'
  surface-tint: '#bec2ff'
  primary: '#bec2ff'
  on-primary: '#000aa6'
  primary-container: '#3d4bff'
  on-primary-container: '#e2e2ff'
  inverse-primary: '#3341f7'
  secondary: '#4ae176'
  on-secondary: '#003915'
  secondary-container: '#00b954'
  on-secondary-container: '#004119'
  tertiary: '#c9c3e1'
  on-tertiary: '#312d45'
  tertiary-container: '#67637d'
  on-tertiary-container: '#e7e1ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bec2ff'
  on-primary-fixed: '#00046a'
  on-primary-fixed-variant: '#0819e2'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#e5dffe'
  tertiary-fixed-dim: '#c9c3e1'
  on-tertiary-fixed: '#1c192f'
  on-tertiary-fixed-variant: '#47445d'
  background: '#12131c'
  on-background: '#e3e1ef'
  surface-variant: '#34343f'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered for WeOne, a professional network built exclusively for Gen Z. The aesthetic combines **Minimalism** with **High-Contrast / Bold** digital native elements, tailored for a generation that values authenticity, speed, and uncompromising visual quality. 

The UI evokes an atmosphere of ambition, clarity, and modern professionalism—shifting away from legacy corporate stiffness toward a dynamic, creator-friendly ecosystem. High-contrast surfaces anchor dense information architecture, while electric accents provide immediate visual feedback.

## Colors

The palette is anchored in deep, immersive dark tones that reduce eye strain during extended networking sessions while making content pop. 

- **Background (`#08070D`)**: The foundational canvas for the entire application.
- **Surface (`#11101A`)**: Elevated containers, navigation bars, and structural panels.
- **Cards (`#171522`)**: Distinct content modules outlined with a precise 1px border (`#26233A`) to establish clear boundary separation without heavy drop shadows.
- **Primary Accent (`#3D4BFF`)**: Electric blue utilized for primary actions, active navigation states, and interactive selections.
- **Secondary Accent (`#22C55E`)**: Vibrant green reserved strictly for status indicators, success states, and availability dots.
- **Text (`#F4F5F8` / `#8E8BA3`)**: High-legibility primary text paired with a balanced secondary tone for metadata and auxiliary labels.

## Typography

Using **Inter** exclusively across all weights, this typography system establishes a systematic, utilitarian foundation with a contemporary edge. 

- **Scale & Hierarchy**: Headlines use tighter letter spacing (`-0.01em` to `-0.02em`) to project modern confidence at larger sizes, while body weights maintain high legibility at dense scanning speeds.
- **Responsive Adaptation**: For viewports under 640px, scale down `display-lg` to 36px and `headline-lg` to 26px to prevent awkward text wrapping on mobile interfaces.

## Layout & Spacing

The layout relies on a **Fluid Grid** system that adapts smoothly across mobile devices, tablets, and wide-screen desktop monitors.

- **Grid Model**: A 12-column fluid grid structure with standardized 16px (`1rem`) gutters and dynamic outer margins. On mobile viewports, reduce outer margins to `1rem` to maximize screen real estate.
- **Spacing Rhythm**: Component padding and layout gaps strictly follow the defined spacing scale (`space-xs` through `space-xl`). Maintain consistent vertical rhythms by stacking elements in multiples of `space-sm` (8px) and `space-md` (16px).

## Elevation & Depth

Depth is conveyed primarily through **Low-contrast outlines** and tonal surface stacking rather than heavy, blurred drop shadows. 

- **Surface Tiers**: The UI stacks flat planes sequentially from background (`#08070D`) to surface (`#11101A`) to cards (`#171522`). 
- **Ghost Borders**: Cards and interactive containers rely on crisp 1px borders (`#26233A`) to define their boundaries against darker backgrounds. Avoid complex multi-layered drop shadows; instead, use subtle ambient glows in primary accent blue (`#3D4BFF` at 10% opacity) exclusively for focused states, floating action elements, and active modals.

## Shapes

The shape language bridges professional structure with approachable, modern software design.

- **Cards & Containers**: Large structural components feature a pronounced **20px radius** to soften the dark-theme geometry.
- **Interactive Elements**: Buttons, search bars, and filter tags utilize fully rounded **pill shapes**, establishing an immediate visual distinction between static layout cards and clickable targets.

## Components

Consistency across all UI components is driven by strict token mapping and predictable interaction states.

- **Buttons**: Rendered as pill shapes with solid primary accent backgrounds (`#3D4BFF`) and high-contrast text (`#F4F5F8`). Hover states should shift brightness by +10%; active states utilize a subtle inner ring. Secondary buttons use transparent backgrounds with a 1px `#26233A` border.
- **Chips & Tags**: Pill-shaped filter and category tags feature surface backgrounds (`#11101A`) and secondary text. Selected chips invert to the primary accent blue (`#3D4BFF`) with bold text.
- **Cards**: Built on the `#171522` surface token, featuring 20px rounded corners and a 1px `#26233A` border. Content padding should be fixed at `space-lg`.
- **Input Fields**: Form inputs use the card surface color, a 1px border, and pill or 12px container rounding. Focus states must transition the border color instantly to primary accent blue (`#3D4BFF`).
- **Checkboxes & Radio Buttons**: Minimal geometric forms with crisp borders. Checked states fill solidly with primary accent blue and display a clean white checkmark or dot.
- **Lists & User Rows**: Designed for networking feeds, featuring avatar containers with integrated availability status dots (`#22C55E`), primary headline text for user names, and secondary metadata for roles and mutual connections.