# The Garden: interactive yard map

A small website with no database or server code. It's plain HTML, CSS and JavaScript, so it works on GitHub Pages or any basic web host.

## Files

| File | What it is | Edit it? |
|---|---|---|
| `data/plants.csv` | The plant list: one row per plant | **Yes, often.** Opens in Excel, Numbers or Google Sheets |
| `data/sections.js` | Garden area names, descriptions and outlines on the map | Sometimes (names and descriptions) |
| `images/yard-satellite.jpg` | The map background (Google satellite screenshot) | Swap it for a drawn map or drone photo later |
| `images/plants/` | Plant photos | Add photos here |
| `index.html`, `style.css`, `app.js` | The page itself | Rarely |

## Adding a plant

Add a row to `data/plants.csv`:

```
section,common_name,botanical_name,notes,photos
west,Bigleaf hydrangea,Hydrangea macrophylla,Planted 2015,hydrangea-1.jpg;hydrangea-2.jpg
```

- `section` must be one of the ids in `data/sections.js`: `front`, `west`, `north`, `east`, `corner`.
- `photos` lists file names in `images/plants/`, separated by semicolons. Leave it blank and the site shows "photo coming soon."
- If a note contains a comma, put the whole note in double quotes.

## Photos

Before uploading, resize photos to about 1600 px on the long side and remove GPS location data. Put small versions (about 200 px) with the same file names in `images/plants/thumbs/` so the plant lists load quickly. If a thumbnail is missing, the full photo is used instead.

## Map credit

Google requires the imagery credit to stay visible under the map. It's in `index.html`.
