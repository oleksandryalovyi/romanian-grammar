# Romanian Grammar

A simple static website (plain HTML/CSS/JS, no build step) for reviewing Romanian grammar.
Each section has a button in the sidebar and two tabs: "Theory" and "Tests".

Live site: https://romanian-grammar.onrender.com

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Adding a new section

1. Create `sections/<name>.js`, following the example in `sections/possession.js`:
   - `id` — short identifier, used in the URL (`#id/theory`),
   - `title`, `subtitle` — shown in the sidebar,
   - `theory` — HTML with the explanation (classes: `card`, `forms` tables, `note`, `warn`, `ro` for Romanian words),
   - `tests` — an array of questions:
     - `{ type: 'choice', q, options: [...], answer, explain }`
     - `{ type: 'input', q, answers: [...], explain }` (diacritics are optional — an answer without them is accepted with a hint).
2. Add `<script src="sections/<name>.js"></script>` to `index.html` before `js/app.js`.
   Script order determines the order of the sidebar buttons.

Best test scores are stored in the browser's `localStorage`.
