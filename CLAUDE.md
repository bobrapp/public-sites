# Managing Bob's public sites

This repository hosts Bob Rapp's public websites on GitHub Pages at
`https://bobrapp.github.io/public-sites/<slug>/`. Each site lives in `sites/<slug>/`.
`sites.json` decides what is online.

## Rules for any assistant (Claude, Perplexity, Copilot)

- A site is online only when its `enabled` field in `sites.json` is `true`.
- To turn a site on or off, run `python3 scripts/sites.py on|off <slug>`, then commit and push to `main`.
  The "Deploy sites" workflow republishes everything in about a minute.
- To hide a site from the index page but keep it online: `python3 scripts/sites.py listed <slug> off`.
- To change a site, edit files under `sites/<slug>/` and push. Keep links relative (no leading `/`),
  because every site is served from a subfolder.
- To add a site, create `sites/<new-slug>/index.html` plus assets and add an entry to `sites.json`
  with `"enabled": false`. Turn it on only after Bob says so.
- Never commit API keys, tokens, passwords or personal data. This repository is public.
- Do not delete a site folder unless Bob asks; turning it off is enough and is reversible.
- Confirm with Bob before turning a site on, since that makes it public.

## Useful commands

```bash
python3 scripts/sites.py list                 # what's on and off
python3 scripts/sites.py off builder-commons  # take one offline
python3 scripts/sites.py on builder-commons   # bring it back
git commit -am "Turn off builder-commons" && git push
```

Without a terminal: GitHub → Actions → Deploy sites → Run workflow, choose `on` or `off`,
and type the slug(s).

## sites.json fields

| Field | Meaning |
|---|---|
| `slug` | Folder name and URL path |
| `title` | Shown on the index page |
| `enabled` | `true` = online |
| `listed` | `false` = online but not on the index page |
| `former_url` | Old pplx.app address (no longer served) |
| `perplexity_id` | Source artifact in Perplexity |
| `notes` | Known limitations, such as features that needed a server |
