# Guide for Claude: the garden website

This file tells Claude (or any helper) everything needed to keep working on this site. The owner is a gardener whose yard was featured on a local garden tour. He is not a programmer. Do the technical work for him, explain things in plain language, and don't ask him to edit code.

## The site

- **Live site:** https://jackvandusen.github.io/garden/
- **Repository:** https://github.com/jackvandusen/garden (public, branch `main`)
- **Hosting:** GitHub Pages, free, publishing from `main` / root. Every commit to `main` goes live in about 1–2 minutes. Progress shows at https://github.com/jackvandusen/garden/actions
- **How it's built:** plain HTML, CSS and JavaScript. No WordPress, no frameworks, no build step, no database. Keep it that way so it stays free and needs no maintenance.

## What the site does

1. A satellite map of the yard with outlined garden areas.
2. On a computer, hovering over an area shows a small card listing its plants. Clicking an area, or tapping it on a phone, shows that area's plants as large photo cards below the map.
3. Clicking a plant opens a photo viewer with a large photo, next and previous arrows (swipe on phones), the botanical name and notes.
4. An A–Z list of every plant at the bottom.
5. Area buttons above the map do the same as clicking the map.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure. The title, the "On the garden tour" line and the intro sentence live here. |
| `style.css` | All colors, fonts and layout. |
| `app.js` | All behavior: reads the plant list, draws the map areas, cards and viewer. |
| `data/plants.csv` | **The plant list. Most updates happen here.** |
| `data/sections.js` | Garden area names, one-line descriptions and outlines on the map. |
| `images/yard-satellite.jpg` | Map background: a Google Maps satellite screenshot, 640×470 px. |
| `images/plants/` | Full-size plant photos. |
| `images/plants/thumbs/` | Small versions (same file names) used on the cards. If one is missing, the full photo is used. |
| `README.md` | Short human-readable overview. |

### data/plants.csv

```
section,common_name,botanical_name,notes,photos
west,Bigleaf hydrangea,Hydrangea macrophylla,Planted 2015,hydrangea-1.jpg;hydrangea-2.jpg
```

- `section` must match an `id` in `data/sections.js`.
- `photos` = file names in `images/plants/`, separated by semicolons. The first one is the card photo. Blank = "photo coming soon."
- Wrap any field that contains a comma in double quotes.
- **Current state:** the rows are placeholders ("Example plant A" and so on). Replace them all with the real list.

### data/sections.js

Each area has `id`, `name`, `blurb` and `points`, which are x,y pixel corners of the outline on the 640×470 satellite image. **The current five areas (front, west, north/"Back garden", east, corner) are guesses** drawn from the satellite image before the owner described his real beds. Redraw them to match how he describes his garden. Outlines can be any polygon, not just rectangles. If you rename an `id`, update the `section` column in `plants.csv` to match.

## Look and feel (chosen by the owner, keep it)

- Layout: centered header, area buttons, wide map, then photo cards (4 across on desktop, 2 on phones), then the A–Z list.
- Colors: dark forest green background `#1c2620`, panels `#243129` / `#2c3a31`, lines `#34433a`, cream text `#ece5d5`, muted `#b9b3a3`, gold highlights `#e3b45a`.
- Fonts (Google Fonts): **Fraunces** for headings, **Source Sans 3** for body text.
- Photo cards are tall (4:5). If most of his photos are wide landscape shots, consider changing the card shape in `style.css` (`.card-photo { aspect-ratio }`).
- Must keep working well on phones. Garden-tour visitors mostly use phones.

## Rules

- **Google credit:** the line "Imagery ©2026 Airbus, Maxar Technologies, Vexcel Imaging US, Inc. · Map data ©2026 Google" must stay visible under the map while the Google satellite image is used. If the map is replaced with his own drawing or a drone photo, the credit can be removed.
- **Privacy:** the site intentionally shows no street address and no owner name. Don't add either unless the owner explicitly asks.
- **Photos:** before adding, resize to about 1600 px on the long side (JPEG quality ~82), make ~400 px thumbnails with the same name in `thumbs/`, and **remove GPS/location data** (EXIF). Use simple lowercase file names with hyphens (for example `bleeding-heart-1.jpg`).
- **Browser caching:** `index.html` loads `style.css?v=2`, `app.js?v=2` and `data/sections.js?v=2`. Whenever you change one of those files, bump the number (`v=3` and so on) in `index.html` so visitors get the new version. `plants.csv` is always fetched fresh, so it needs no number.
- Test changes before publishing if you can, at both phone and computer widths.

## Still to do (as of the handoff)

1. Real site title and intro sentence (now "The Garden" / "A shady, tree-filled yard.").
2. Real garden areas: redraw the outlines and names from the owner's description.
3. Real plant list in `data/plants.csv`.
4. Plant photos (the owner has high-quality photos).
5. Optional: replace the satellite image with a sharper map, his own drawing or a drone photo. The outlines would then need redrawing on the new image's pixel grid; keep the `viewBox` in `index.html` matching the image size.
6. Optional: an "About this garden" section, or a custom domain (about $10–15/year, the only part that costs money).

## How the owner will send content

- **Plant info:** a spreadsheet (Excel, Google Sheets or Numbers) with one row per plant: Area, Common name, Botanical name (optional), Notes (optional), Photo files (original camera file names, comma-separated). A second tab can describe new areas in words.
- **Plan B:** photos named after the plant ("Bleeding heart 1.jpg") inside folders named for each area. Build the list from that.
- **Photos:** a folder attached to the chat (zip), a shared Google Drive or Box link, or a folder on his computer connected through the Claude desktop app.

## How to publish changes

Use whichever works in the current session:

1. **Browser (how it has been done so far):** with the owner signed in to GitHub in the browser Claude can control, open `https://github.com/jackvandusen/garden/upload/main` (add `/data`, `/images/plants` and so on to the URL for subfolders), upload the changed files, add a short commit message and click **Commit changes**. Then wait about a minute and check the live site. Uploads are limited to a few MB per batch, so send photos in small batches.
2. **If Claude can't control a browser:** prepare the finished files, give them to the owner, and walk him through the same upload page step by step. Tell him exactly which folder each file goes in.
3. Never ask for, or type in, his GitHub password. He signs in himself.
