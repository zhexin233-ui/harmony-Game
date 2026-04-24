# Design System Strategy: The Kinetic Playground

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Playground."** 

In the world of social gaming, static interfaces are the enemy of engagement. This system moves beyond the "app-as-a-utility" mindset, treating the UI as a living, breathing participant in the game. We break the rigid, corporate grid by utilizing **Intentional Asymmetry** and **Layered Depth**. 

While the "Q-Version" theme focuses on tactile softness and "Neon Video Game" focuses on high-octane luminescence, both are united by a signature editorial rhythm: massive, high-contrast typography juxtaposed against compact, interactive clusters. By overlapping elements and using extreme typography scales, we create a sense of organized chaos that feels energetic, social, and premium.

## 2. Colors & Surface Philosophy
The palette is built on high-chroma primaries and sophisticated surface tiers. We do not use color merely for decoration; we use it to define the physics of the interface.

*   **The "No-Line" Rule:** To maintain a high-end, bespoke feel, designers are **prohibited from using 1px solid borders** for sectioning. Boundaries must be defined through background color shifts. For instance, a `surface-container-low` card should sit on a `surface` background to create a soft, edge-less transition.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers.
    *   **Lowest Level:** `surface` or `surface-container-lowest` (the base floor).
    *   **Interactive Level:** `surface-container` (cards and primary interaction zones).
    *   **Elevation Level:** `surface-container-highest` (modals and urgent callouts).
*   **The "Glass & Gradient" Rule:** Flat colors are the baseline, but "The Kinetic Playground" thrives on depth. For floating action buttons or game-state overlays, use **Glassmorphism**: semi-transparent `surface` colors paired with a `backdrop-blur(20px)`. 
*   **Signature Textures:** Apply linear gradients transitioning from `primary` (#b00074) to `primary_container` (#ff6bb9) for Hero CTAs. This creates a "glow from within" effect that provides a professional polish far exceeding flat fills.

## 3. Typography: The Editorial Voice
Typography is the primary driver of the energetic vibe. We use a dual-typeface system to balance character with legibility.

*   **Display & Headlines (Plus Jakarta Sans):** These are the "shouting" elements of the game. They should be used with tight letter-spacing (-0.02em) to create a dense, authoritative block of text that feels modern and custom.
*   **Body & Titles (Be Vietnam Pro):** Vietnamese design influences provide a clean, rhythmic quality to the body text. Use `body-lg` for game instructions to ensure accessibility during fast-paced play.
*   **Scale Hierarchy:** 
    *   **Display-LG (3.5rem):** Reserved for scores, "Game Over" screens, and win states.
    *   **Label-SM (0.6875rem):** Used for micro-copy and metadata, always in all-caps with increased tracking (+0.05em) to maintain a premium editorial feel.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows often look muddy. In this design system, we achieve height through light and tone.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle contrast mimics natural light without requiring structural lines.
*   **Ambient Shadows:** If an element must "float" (e.g., a "New Level" pop-up), use an **Extra-Diffused Shadow**. 
    *   **Blur:** 40px - 60px.
    *   **Opacity:** 4% - 8%.
    *   **Color:** Use a tinted version of `on-surface` (#492136) rather than pure black to keep the shadows "warm" and integrated.
*   **The "Ghost Border" Fallback:** If a border is required for high-contrast accessibility, use a "Ghost Border": the `outline-variant` token (#d69db6) at **15% opacity**. This provides a hint of structure without breaking the organic flow.
*   **Neon Logic:** In the Neon theme, the `secondary_fixed` (#56f1e0) and `tertiary_fixed` (#ffeb3b) tokens act as light sources. Apply a 10px outer glow (using the color’s own value) to these elements to simulate an arcade CRT monitor.

## 5. Components & Primitive Styling

*   **Buttons:** 
    *   **Primary:** Use `primary` background with `on_primary` text. Corners should be `xl` (3rem) for a pill-shape or `md` (1.5rem) for a chunky, "Q-Version" feel.
    *   **States:** On press, the button should scale down to 0.96 and shift from `primary` to `primary_dim`.
*   **Interactive Chips:** Use `secondary_container` for selection. Use the `full` (9999px) roundedness token to create a playful, pebble-like aesthetic.
*   **Cards & Lists:** 
    *   **Forbid dividers.** Instead, use vertical white space. A gap of `1.5rem` (based on the `md` roundedness scale) is the standard separation between content blocks.
    *   **Asymmetry:** Occasionally offset a card by 4-8 pixels from the center of the grid to create a "scattered" look that feels more like a physical game board than a mobile app.
*   **Input Fields:** Use `surface_container_highest` for the field background. The label should be in `plusJakartaSans` (Label-MD) to maintain the brand’s bold voice even in forms.
*   **Signature Component - The "Power-Up" Card:** A card utilizing a gradient from `tertiary_container` to `tertiary`, featuring an icon that overlaps the top-right edge of the card boundary.

## 6. Do’s and Don’ts

### Do:
*   **Overlap Elements:** Let icons and typography spill out of their containers to create movement.
*   **Use High-Contrast Scaling:** Pair a `display-lg` headline with a `body-sm` description for a sophisticated editorial look.
*   **Lean into the Theme:** In Q-Version, use `xl` roundedness. In Neon, use `none` or `sm` roundedness to mimic pixel-art.

### Don’t:
*   **Don't use 100% opaque borders:** They trap the eye and make the app feel like a legacy utility.
*   **Don't use generic grey shadows:** Always tint your shadows with the `on-surface` color.
*   **Don't crowd the screen:** This system relies on "The Breathing Rule"—ensure the distance between distinct functional groups is at least double the `DEFAULT` roundedness value (2rem).