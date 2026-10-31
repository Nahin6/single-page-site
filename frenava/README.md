# Frenava — Botanical Cleansing Cream landing page

A one-page product landing site built around the Frenava product film. It's plain HTML, CSS and JavaScript with no build step and no dependencies.

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
cd frenava
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure
```
frenava/
├── index.html      # markup & content
├── styles.css      # design tokens, layout, animations, responsive rules
├── script.js       # interactions & scroll motion
└── assets/
    ├── hero.mp4         # hero video, 720p, muted, web-optimized
    ├── hero-mobile.mp4  # lighter 480p version served to small screens
    ├── poster.jpg       # video poster / fallback
    └── *.jpg            # stills taken from the product film
```

## Sections
1. **Hero**: full-bleed looping product video, falling-petal canvas, word-by-word headline reveal, pause/play control
2. **Marquee**: ingredient ticker
3. **Story**: text that lights up word by word as you scroll, plus animated counters
4. **The Cream**: sticky image that changes as each feature scrolls into view (stacks inline on mobile)
5. **Botanicals**: ingredient cards with self-drawing line illustrations and 3D tilt on hover
6. **Quote banner**: parallax image
7. **Ritual**: three steps with a progress line linked to scrolling
8. **Made Mindfully**: parallax gallery and checklist
9. **Reviews**: swipeable carousel with autoplay, dots, arrows and keyboard support
10. **Shop**: size picker, quantity stepper, add-to-bag with bag counter and toast
11. **FAQ**: smooth accordion
12. **Newsletter** (validated form) and **footer**

## UX & accessibility
- Responsive from 320px phones to wide desktops; full-screen animated mobile menu
- Respects `prefers-reduced-motion` (no autoplay, no parallax or petals)
- Skip link, visible focus states, ARIA on the menu, carousel, accordion and live regions
- Video and petals pause when off-screen or when the tab is hidden, to save battery
