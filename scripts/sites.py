#!/usr/bin/env python3
"""Turn public sites on or off and build the GitHub Pages output.

  python3 scripts/sites.py list
  python3 scripts/sites.py on  <slug> [<slug> ...]     # publish
  python3 scripts/sites.py off <slug> [<slug> ...]     # take offline
  python3 scripts/sites.py listed   <slug> on|off      # show/hide on the public index page
  python3 scripts/sites.py build                       # write _site/ (used by the workflow)

sites.json is the single source of truth. A site is online only when "enabled" is true.
Commit and push after on/off; the Pages workflow redeploys in about a minute.
"""
import html, json, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = ROOT / "sites.json"
SITE = ROOT / "_site"
BASE = "https://bobrapp.github.io/public-sites"


def load():
    return json.loads(CFG.read_text())


def save(cfg):
    CFG.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")


def find(cfg, slug):
    for s in cfg["sites"]:
        if s["slug"] == slug:
            return s
    sys.exit(f"Unknown site '{slug}'. Run: python3 scripts/sites.py list")


def cmd_list():
    cfg = load()
    for s in sorted(cfg["sites"], key=lambda s: s["slug"]):
        state = "ON " if s["enabled"] else "off"
        print(f"{state}  {s['slug']:<40} {BASE}/{s['slug']}/   {s.get('title','')}")
    on = sum(s["enabled"] for s in cfg["sites"])
    print(f"\n{on} of {len(cfg['sites'])} sites online")


def cmd_toggle(value, slugs):
    cfg = load()
    for slug in slugs:
        find(cfg, slug)["enabled"] = value
        print(f"{'ON ' if value else 'off'}  {slug}")
    save(cfg)


def cmd_listed(slug, value):
    cfg = load()
    find(cfg, slug)["listed"] = value == "on"
    save(cfg)


def cmd_build():
    cfg = load()
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    rows = []
    for s in sorted(cfg["sites"], key=lambda s: s["slug"]):
        if not s["enabled"]:
            continue
        src = ROOT / "sites" / s["slug"]
        if not src.exists():
            print(f"missing folder for {s['slug']}, skipped")
            continue
        shutil.copytree(src, SITE / s["slug"])
        if s.get("listed", True):
            rows.append(f'<li><a href="{s["slug"]}/">{html.escape(s.get("title") or s["slug"])}</a></li>')
    title = html.escape(cfg.get("index_title", "Sites"))
    (SITE / "index.html").write_text(
        f"<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
        f"<title>{title}</title><style>body{{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:3rem auto;padding:0 1rem}}</style>"
        f"<h1>{title}</h1><ul>{''.join(rows)}</ul></html>" if cfg.get("show_index", True) else
        "<!doctype html><title>Not found</title>")
    (SITE / ".nojekyll").write_text("")
    (SITE / "404.html").write_text("<!doctype html><title>Not found</title><p>This page is not available.</p>")
    print(f"built {sum(1 for s in cfg['sites'] if s['enabled'])} site(s)")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    if a[0] == "list":
        cmd_list()
    elif a[0] in ("on", "off") and len(a) > 1:
        cmd_toggle(a[0] == "on", a[1:])
    elif a[0] == "listed" and len(a) == 3:
        cmd_listed(a[1], a[2])
    elif a[0] == "build":
        cmd_build()
    else:
        sys.exit(__doc__)
