import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from check_sarif import check


class SecurityGateTests(unittest.TestCase):
    def report(self, severity, level='warning'):
        return {'version': '2.1.0', 'runs': [{'tool': {'driver': {'rules': [
            {'id': 'test/rule', 'properties': {'security-severity': severity},
             'defaultConfiguration': {'level': level}}]}}, 'results': [{'ruleId': 'test/rule'}]}]}

    def test_missing_analysis_is_not_a_pass(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'No SARIF'):
                check(directory)

    def test_high_critical_and_error_results_fail(self):
        for severity, level in [('7.0', 'warning'), ('9.5', 'warning'), ('0', 'error')]:
            with tempfile.TemporaryDirectory() as directory:
                Path(directory, 'scan.sarif').write_text(json.dumps(self.report(severity, level)))
                with self.assertRaisesRegex(ValueError, 'Security findings'):
                    check(directory)

    def test_low_severity_and_empty_results_pass(self):
        for empty in [True, False]:
            with tempfile.TemporaryDirectory() as directory:
                data = self.report('3.0')
                if empty:
                    data['runs'][0]['results'] = []
                Path(directory, 'scan.sarif').write_text(json.dumps(data))
                check(directory)

    def test_query_pack_extension_rules_are_enforced(self):
        with tempfile.TemporaryDirectory() as directory:
            data = self.report('8.0')
            tool = data['runs'][0]['tool']
            tool['extensions'] = [{'rules': tool['driver'].pop('rules')}]
            Path(directory, 'scan.sarif').write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'test/rule'):
                check(directory)
