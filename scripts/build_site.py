#!/usr/bin/env python3
"""Build the static demo from canonical widget files and checked-in examples."""
import argparse
import shutil
import json
from pathlib import Path
from generate import required_variables, ISRAEL_DRAFTS, EU_OVERLAY, FLAG_KEYS
from packs import load_packs

ROOT = Path(__file__).resolve().parent.parent


def build(output):
    output = Path(output).resolve()
    # Never overwrite a source tree or an ancestor of the repository.
    if output == ROOT or output in ROOT.parents or output == ROOT / "docs" or output == ROOT / "widgets":
        raise ValueError("Choose a dedicated site output directory")
    if output.is_relative_to(ROOT) and output.relative_to(ROOT).parts[0] not in ("generated", "test-results"):
        raise ValueError("Use generated/ or test-results/ for output inside the repository")
    output.mkdir(parents=True, exist_ok=True)
    for source in (ROOT / "docs" / "site").iterdir():
        if source.is_file():
            shutil.copy2(source, output / source.name)
    for name in ("cookie-consent.js", "cookie-consent.css"):
        shutil.copy2(ROOT / "widgets" / "cookie-consent" / name, output / name)
    for directory, sources in (("profiles", ROOT / "examples" / "profiles"), ("examples", ROOT / "docs" / "examples")):
        destination = output / directory
        destination.mkdir(exist_ok=True)
        for source in sources.iterdir():
            if source.is_file():
                shutil.copy2(source, destination / source.name)
    (output / ".nojekyll").touch()
    packs, errors, _ = load_packs()
    if errors:
        raise ValueError("Invalid packs: " + "; ".join(errors))
    templates = ROOT / "skills" / "web-compliance" / "templates"
    files = {}
    for directory in ("skills/web-compliance", "widgets", "schemas", "scripts", "examples", "docs", "tests", ".github", ".claude-plugin"):
        for source in (ROOT / directory).rglob("*"):
            if source.is_file() and source.suffix in (".md", ".yaml", ".yml", ".json", ".js", ".cjs", ".css", ".py", ".html"):
                files[source.relative_to(ROOT).as_posix()] = source.read_text(encoding="utf-8")
    for name in ("LICENSE", "requirements.txt", "README.md", "README.he.md", "package.json", "package-lock.json", ".gitignore", ".gitattributes", "CHANGELOG.md"):
        files[name] = (ROOT / name).read_text(encoding="utf-8")
    catalog = [{"id": p.stem, "required": required_variables(p.stem),
                "scope": "il" if p.stem in ISRAEL_DRAFTS else "il+eu" if p.stem in EU_OVERLAY else "all"}
               for p in sorted(templates.glob("*.md"))]
    (output / "toolkit.json").write_text(json.dumps({"files": files, "catalog": catalog,
        "packs": packs, "flags": sorted(FLAG_KEYS)}, ensure_ascii=False), encoding="utf-8")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "generated" / "site")
    print(build(parser.parse_args().output))
