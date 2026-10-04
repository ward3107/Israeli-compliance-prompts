#!/usr/bin/env python3
"""Reject stale, unhashed or unpinned Python requirements before publication."""
import argparse
import importlib.metadata
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIN = re.compile(r'([A-Za-z0-9][A-Za-z0-9._-]*)==([A-Za-z0-9][A-Za-z0-9.!+_-]*)')
HASH = re.compile(r'--hash=sha256:[0-9a-f]{64}')


def read_pins(text, *, hashes=False):
    pins, pending = {}, ''
    for raw in text.splitlines():
        line = raw.split('#', 1)[0].strip()
        if not line:
            continue
        continued = line.endswith('\\')
        pending += ' ' + (line[:-1] if continued else line)
        if continued:
            continue
        tokens, pending = pending.split(), ''
        match = PIN.fullmatch(tokens[0])
        if not match:
            raise ValueError('Every dependency must use an exact name==version pin')
        name = re.sub(r'[-_.]+', '-', match[1]).lower()
        if name in pins:
            raise ValueError('Duplicate dependency: ' + name)
        if hashes and (len(tokens) < 2 or not all(HASH.fullmatch(t) for t in tokens[1:])):
            raise ValueError('Missing or invalid SHA-256 hashes: ' + name)
        if not hashes and len(tokens) != 1:
            raise ValueError('Unexpected dependency options: ' + name)
        pins[name] = match[2]
    if pending or not pins:
        raise ValueError('Incomplete or empty requirements')
    return pins


def check(root=ROOT, *, installed=False):
    root = Path(root)
    direct = read_pins((root / 'requirements.in').read_text(encoding='utf-8'))
    locked = read_pins((root / 'requirements.txt').read_text(encoding='utf-8'), hashes=True)
    for name, version in direct.items():
        if locked.get(name) != version:
            raise ValueError(f'Stale requirements.txt: {name} must be {version}; regenerate with pip-compile')
    if installed:
        for name, version in locked.items():
            try:
                actual = importlib.metadata.version(name)
            except importlib.metadata.PackageNotFoundError as exc:
                raise ValueError('Dependency is not installed: ' + name) from exc
            if actual != version:
                raise ValueError(f'Installed dependency mismatch: {name} is {actual}, expected {version}')
    return len(locked)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--installed', action='store_true', help='Also verify every installed locked version')
    args = parser.parse_args()
    try:
        print(f'Python dependency pins and hashes verified ({check(installed=args.installed)} packages).')
    except (ValueError, OSError) as exc:
        parser.exit(1, str(exc) + '\n')
