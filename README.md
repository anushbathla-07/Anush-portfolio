# Anush Bathla — Cinematic Portfolio

## Run
Double-click `index.html` (or use VS Code Live Server). Internet is only needed for Google Fonts.

## What happens when it opens
1. Loader counts 0 → 100%, then **CLICK TO ENTER — WITH SOUND**.
2. That click starts the background music (browsers block music without a click, so this is the reliable way).
3. Photo reveals full-screen with a scanline, giant PORTFOLIO text rises, then the text **types out step by step**:
   HELLO, I'M → ANUSH BATHLA. → role → focus line → intro → buttons & links.
4. While scrolling, every section animates in: kinetic headings, typed paragraphs,
   photo curtain reveal, count-up stats, popping skill chips, sliding project rows.

## Controls
- **SKIP INTRO** button (bottom-left) during the intro.
- **PLAY / PAUSE music** button (bottom-right). Music pauses when the tab is hidden.
- Respects `prefers-reduced-motion`.

## Customize
- Text: `index.html` (add `data-type="ms-per-char"` to any element to make it type on scroll).
- Colours / spacing: `:root` variables at the top of `style.css`.
- Music: replace `assets/portfolio-theme.mp3`. Photo: replace `assets/anush-profile.jpg`.

Make sure you have the rights to use the music track before publishing publicly.
