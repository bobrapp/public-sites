# Bob Rapp's Public Sites

Public websites formerly hosted on `*.pplx.app`, now served by GitHub Pages at
**https://bobrapp.github.io/public-sites/**.

Every site has its own on/off switch in [`sites.json`](sites.json). See
[CLAUDE.md](CLAUDE.md) for how to manage them with Claude or any other assistant.

## Turn a site on or off

**Terminal**

```bash
python3 scripts/sites.py list
python3 scripts/sites.py off jp-ineke-roadtrip
git commit -am "Turn off jp-ineke-roadtrip" && git push
```

**Browser or phone:** Actions → **Deploy sites** → Run workflow → choose `on` or `off` and type the slug.

**Claude:** open this repository in Claude Code (or attach it in claude.ai with GitHub) and say,
for example, "turn off jp-ineke-roadtrip" or "list which sites are on."

Changes go live in about a minute.

## Important

This repository is public. Turning a site off removes it from the website, but its files
remain visible in the repository and its history. To remove a site completely, delete
its folder and ask for the history to be rewritten.

## Sites

See `python3 scripts/sites.py list` or the table in [SITES.md](SITES.md).
