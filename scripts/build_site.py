#!/usr/bin/env python3
"""Build the static demo from canonical widget files and checked-in examples."""
import argparse
import json
import hashlib
import zipfile
from pathlib import Path
from generate import required_variables, ISRAEL_DRAFTS, EU_OVERLAY, FLAG_KEYS
from packs import load_packs

ROOT = Path(__file__).resolve().parent.parent
CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"


def public_files():
    """A reviewed allowlist, independent of git and of private local files."""
    names = json.loads((ROOT / 'scripts/public-files.json').read_text())
    files = {}
    for name in names:
        parts = Path(name).parts
        if not parts or Path(name).is_absolute() or any(p in ('.', '..') for p in parts) or '\\' in name:
            raise ValueError('Invalid public source path')
        source = ROOT / name
        if any(p.is_symlink() for p in (source, *source.parents)):
            raise ValueError('Symlink in public source: ' + name)
        files[name] = source.read_text(encoding='utf-8')
    return files


def secure_html(text):
    # GitHub Pages cannot configure response headers: this is a useful subset,
    # not a substitute for header-only controls such as frame-ancestors/HSTS.
    return text.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + CSP + '"><meta name="referrer" content="no-referrer">', 1)


def build(output):
    output = Path(output).resolve()
    # Never overwrite a source tree or an ancestor of the repository.
    if output == ROOT or output in ROOT.parents or output == ROOT / "docs" or output == ROOT / "widgets":
        raise ValueError("Choose a dedicated site output directory")
    if output.is_relative_to(ROOT) and output.relative_to(ROOT).parts[0] not in ("generated", "test-results"):
        raise ValueError("Use generated/ or test-results/ for output inside the repository")
    output.mkdir(parents=True, exist_ok=True)
    if any(p.is_symlink() for p in output.rglob('*')):
        raise ValueError('Symlink in site output')
    files = public_files()
    site_files = {}
    for name, text in files.items():
        if name.startswith('docs/site/'):
            site_files[Path(name).name] = secure_html(text) if name.endswith('.html') else text
    for name in ("cookie-consent.js", "cookie-consent.css"):
        site_files[name] = files['widgets/cookie-consent/' + name]
    for name, text in files.items():
        for prefix, directory in [('examples/profiles/', 'profiles/'), ('docs/examples/', 'examples/')]:
            if name.startswith(prefix):
                site_files[directory + Path(name).name] = text
    for name, text in site_files.items():
        destination = output / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding='utf-8')
    (output / ".nojekyll").touch()
    packs, errors, _ = load_packs()
    if errors:
        raise ValueError("Invalid packs: " + "; ".join(errors))
    templates = ROOT / "skills" / "web-compliance" / "templates"
    catalog = [{"id": p.stem, "required": required_variables(p.stem),
                "scope": "il" if p.stem in ISRAEL_DRAFTS else "il+eu" if p.stem in EU_OVERLAY else "all"}
               for p in sorted(templates.glob("*.md"))]
    payload = json.dumps({"files": files, "catalog": catalog,
        "packs": packs, "flags": sorted(FLAG_KEYS)}, ensure_ascii=False)
    (output / "toolkit.json").write_text(payload, encoding="utf-8")
    # A double-clickable distribution: no fetch(file://), local server, npm,
    # Python, CDN, or hosted account is required for end users.
    offline = dict(site_files)
    offline['toolkit-loader.js'] = 'window.ToolkitSource={load:function(){return Promise.resolve(' + payload.replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029') + ');}};\n'
    offline['START-HERE.html'] = site_files['explore.html']
    offline['LICENSE'] = files['LICENSE']
    archive = output / 'web-compliance-studio.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as package:
        for name, text in sorted(offline.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            package.writestr(info, text.encode('utf-8'))
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / 'SHA256SUMS.txt').write_text(checksum + '  ' + archive.name + '\n')
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "generated" / "site")
    print(build(parser.parse_args().output))
