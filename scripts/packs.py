"""Shared, strict loading and validation for jurisdiction packs."""
import datetime
import json
from pathlib import Path
from urllib.parse import urlparse

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent.parent
PACK_DIR = ROOT / "skills" / "web-compliance" / "jurisdictions"


class UniqueLoader(yaml.SafeLoader):
    pass


def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f"duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)
# Keep ISO dates as strings, so the JSON schema checks their original shape.
UniqueLoader.yaml_implicit_resolvers = {
    key: [(tag, regex) for tag, regex in values if tag != "tag:yaml.org,2002:timestamp"]
    for key, values in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


def read_yaml(path):
    return yaml.load(Path(path).read_text(encoding="utf-8"), Loader=UniqueLoader)


def load_packs(directory=PACK_DIR, today=None, strict_stale=None):
    today = today or datetime.date.today()
    schema = json.loads((ROOT / "schemas" / "jurisdiction.schema.json").read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    packs, errors, warnings = {}, [], []
    for path in sorted(Path(directory).glob("*.yaml")):
        label = path.name
        try:
            data = read_yaml(path)
        except (ValueError, yaml.YAMLError, TypeError) as exc:
            errors.append(f"{label}: invalid YAML: {exc}")
            continue
        problems = sorted(validator.iter_errors(data), key=lambda e: str(list(e.path)))
        if problems:
            errors.extend(f"{label}: {'.'.join(map(str, e.path)) or 'root'}: {e.message}" for e in problems)
            continue
        if data["jurisdiction"] != path.stem:
            errors.append(f"{label}: jurisdiction must match filename")
        for key in ("sources_checked_on", "legal_reviewed_on"):
            if key in data and datetime.date.fromisoformat(data[key]) > today:
                errors.append(f"{label}: {key} cannot be in the future")
        age = (today - datetime.date.fromisoformat(data["last_reviewed"])).days
        if age < 0:
            errors.append(f"{label}: last_reviewed cannot be in the future")
        elif strict_stale is not None and age > strict_stale:
            errors.append(f"{label}: last_reviewed is {age} days old (over the {strict_stale}-day freshness limit)")
        elif age > 365:
            warnings.append(f"{label}: last_reviewed is {age} days old — re-check the citations")
        if data["needs_legal_review"]:
            warnings.append(f"{label}: still flagged needs_legal_review — not yet signed off by a lawyer")
        elif data.get("reviewed_by", "").strip().lower() in ("", "unverified", "pending"):
            errors.append(f"{label}: legal sign-off requires an identified reviewer")
        ids = set()
        for framework in data["frameworks"]:
            if framework["id"] in ids:
                errors.append(f"{label}: duplicate framework id {framework['id']}")
            ids.add(framework["id"])
            url = urlparse(framework["citation"])
            if url.scheme not in ("https", "http") or not url.netloc:
                errors.append(f"{label}: {framework['id']} citation must be an HTTP(S) URL")
        packs[path.stem] = data
    if not packs and not errors:
        errors.append("no jurisdiction packs found")
    for code, pack in packs.items():
        refs = ([pack["extends"]] if "extends" in pack else []) + [c["with"] for c in pack.get("conflicts", [])]
        for ref in refs:
            if ref not in packs:
                errors.append(f"{code}.yaml: reference to missing or invalid pack {ref}")
        seen, node = set(), code
        while node in packs:
            if node in seen:
                errors.append(f"{code}.yaml: inheritance cycle involving {node}")
                break
            seen.add(node)
            node = packs[node].get("extends")
    return packs, errors, warnings


def expand_packs(codes, packs):
    """Parents precede children; each pack appears once. Reject unknowns/cycles."""
    result, visiting = [], set()

    def visit(code):
        if code not in packs:
            raise ValueError(f"Unsupported jurisdiction: {code}; available: {', '.join(sorted(packs))}")
        if code in visiting:
            raise ValueError(f"Inheritance cycle: {code}")
        if code in result:
            return
        visiting.add(code)
        if packs[code].get("extends"):
            visit(packs[code]["extends"])
        visiting.remove(code)
        result.append(code)

    for code in codes:
        visit(code)
    return result
