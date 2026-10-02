#!/usr/bin/env python3
"""Regenerate checked-in synthetic examples, or ensure they match their sources."""
import argparse
import datetime
from pathlib import Path
from generate import ROOT, compose, load_profile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", default="2026-10-02", help="Example build date; advance it when source review dates change")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    date = datetime.date.fromisoformat(args.date)
    output = ROOT / "docs" / "examples"
    output.mkdir(parents=True, exist_ok=True)
    failed = False
    for profile in sorted((ROOT / "examples" / "profiles").glob("*.json")):
        prompt, _ = compose(load_profile(profile), "cookie-banner", date)
        destination = output / f"{profile.stem}-cookie-banner.md"
        if args.check:
            if not destination.exists() or destination.read_text(encoding="utf-8") != prompt:
                print(f"ERROR stale example: {destination.name}; run python scripts/build_examples.py")
                failed = True
        else:
            destination.write_text(prompt, encoding="utf-8")
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
