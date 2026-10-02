#!/usr/bin/env python3
"""Build the static demo from canonical widget files and checked-in examples."""
import argparse
import shutil
from pathlib import Path

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
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "generated" / "site")
    print(build(parser.parse_args().output))
