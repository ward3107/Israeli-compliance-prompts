"""Fail CI on missing analysis or high/critical/error findings, on pushes too."""
import json
import sys
from pathlib import Path


def check(directory):
    reports = sorted(Path(directory).glob('*.sarif'))
    if not reports:
        raise ValueError('No SARIF analysis reports found')
    findings = []
    for path in reports:
        data = json.loads(path.read_text())
        if data.get('version') != '2.1.0' or not data.get('runs'):
            raise ValueError('Incomplete SARIF report: ' + path.name)
        for run in data['runs']:
            # CodeQL query packs can put rule metadata in tool extensions,
            # not only the driver (SARIF 2.1 reportingDescriptor references).
            components = [run['tool']['driver'], *run['tool'].get('extensions', [])]
            rules = {rule['id']: rule for component in components for rule in component.get('rules', [])}
            if not isinstance(run.get('results'), list):
                raise ValueError('Missing analysis results: ' + path.name)
            for result in run['results']:
                rule = rules[result['ruleId']]
                properties = rule.get('properties', {})
                severity = float(properties.get('security-severity', 0))
                level = result.get('level', rule.get('defaultConfiguration', {}).get('level', 'warning'))
                if severity >= 7 or level == 'error':
                    locations = result.get('locations', [])
                    physical = locations[0].get('physicalLocation', {}) if locations else {}
                    location = physical.get('artifactLocation', {}).get('uri', 'unknown')
                    line = physical.get('region', {}).get('startLine', '?')
                    findings.append(path.name + ': ' + result['ruleId'] + ' at ' + location + ':' + str(line))
    if findings:
        raise ValueError('Security findings block publication: ' + '; '.join(findings))


if __name__ == '__main__':
    try:
        check(sys.argv[1] if len(sys.argv) > 1 else 'codeql-results')
    except (ValueError, KeyError, TypeError, OSError) as error:
        sys.exit(str(error))
    print('SARIF gate passed: no high/critical security or error findings')
