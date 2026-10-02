#!/usr/bin/env python3
"""Structural checks for the web-compliance skill.

Catches the failure modes that matter for legally sensitive templates:
uncited requirements, stale review dates, and templates that ask for a
language but have nowhere to put it.

Usage:  python3 scripts/validate.py [--strict-stale DAYS]
Exit code 1 if any ERROR is found. Warnings do not fail the run.

  --strict-stale DAYS   Promote the "last_reviewed too old" check from a warning
                        to an ERROR when a pack is older than DAYS. Used by the
                        scheduled freshness workflow so citation rot fails CI
                        (and opens an issue) instead of sitting as a warning.
"""
import argparse
import datetime
import pathlib
import re
import sys

from packs import load_packs

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "web-compliance"
TEMPLATES = SKILL / "templates"
JURISDICTIONS = SKILL / "jurisdictions"
STALE_AFTER_DAYS = 365

# Set from --strict-stale; when not None, a pack older than this many days is an
# ERROR rather than a warning.
STRICT_STALE_DAYS: int | None = None

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


# ---------------------------------------------------------------- templates
def check_templates() -> None:
    files = sorted(TEMPLATES.glob("*.md"))
    if not files:
        err("no templates found in templates/")
        return

    for f in files:
        text = f.read_text(encoding="utf-8")
        rel = f.relative_to(ROOT)

        # The skill always asks for an output language, so every template
        # needs somewhere to put the answer.
        if "[LANGUAGE]" not in text:
            err(f"{rel}: no [LANGUAGE] placeholder — the language choice would be discarded")

        # Every template should give the user a way to check the output.
        if not re.search(r"##\s*.*Checklist", text):
            err(f"{rel}: no checklist section")

        # Unresolved placeholders should be bracketed consistently.
        for stray in re.findall(r"\{\{[^}]+\}\}|\$\{[^}]+\}", text):
            warn(f"{rel}: non-bracket placeholder {stray!r} — use [UPPER_SNAKE] instead")

        # Accessibility templates must not silently target the older standard.
        if "accessibility" in f.name or "wcag" in text.lower():
            if "WCAG 2.0" in text and "WCAG 2.1" not in text:
                warn(
                    f"{rel}: mentions WCAG 2.0 but not 2.1 — the EAA requires 2.1 AA, "
                    "so EU-facing sites need the higher bar"
                )


# ----------------------------------------------------------- jurisdictions
def check_jurisdictions() -> None:
    _, pack_errors, pack_warnings = load_packs(JURISDICTIONS, strict_stale=STRICT_STALE_DAYS)
    errors.extend(pack_errors)
    warnings.extend(pack_warnings)


# ------------------------------------------------------------------ disclaimer
def check_disclaimer() -> None:
    for rel in ("README.md", "skills/web-compliance/SKILL.md"):
        p = ROOT / rel
        if not p.exists():
            err(f"{rel}: missing")
            continue
        if "not legal advice" not in p.read_text(encoding="utf-8").lower():
            err(f"{rel}: missing the 'Not legal advice' disclaimer")


def main() -> int:
    global STRICT_STALE_DAYS
    parser = argparse.ArgumentParser(description="Validate the web-compliance skill.")
    parser.add_argument(
        "--strict-stale",
        type=int,
        metavar="DAYS",
        default=None,
        help="Treat a pack whose last_reviewed is older than DAYS as an ERROR, not a warning.",
    )
    args = parser.parse_args()
    if args.strict_stale is not None and args.strict_stale < 0:
        parser.error("--strict-stale must be non-negative")
    STRICT_STALE_DAYS = args.strict_stale

    check_templates()
    check_jurisdictions()
    check_disclaimer()

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")

    print(
        f"\n{len(list(TEMPLATES.glob('*.md')))} templates, "
        f"{len(list(JURISDICTIONS.glob('*.yaml')))} jurisdictions — "
        f"{len(errors)} error(s), {len(warnings)} warning(s)"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
