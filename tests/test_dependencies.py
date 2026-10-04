import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from check_dependencies import check, read_pins

HASH = '--hash=sha256:' + 'a' * 64


class DependencyGateTests(unittest.TestCase):
    def fixture(self, root, source='My_Package==1.2.3', locked=None):
        Path(root, 'requirements.in').write_text(source)
        Path(root, 'requirements.txt').write_text(locked or ('my-package==1.2.3 \\\n    ' + HASH))

    def test_compiled_continuations_and_normalized_names(self):
        with tempfile.TemporaryDirectory() as root:
            self.fixture(root)
            self.assertEqual(check(root), 1)

    def test_direct_update_cannot_silently_test_the_old_version(self):
        with tempfile.TemporaryDirectory() as root:
            self.fixture(root, source='my-package==1.3.0')
            with self.assertRaisesRegex(ValueError, 'Stale requirements.txt'):
                check(root)

    def test_missing_direct_dependency_fails(self):
        with tempfile.TemporaryDirectory() as root:
            self.fixture(root, source='another-package==1.2.3')
            with self.assertRaisesRegex(ValueError, 'Stale requirements.txt'):
                check(root)

    def test_every_locked_entry_requires_real_hash_syntax(self):
        for text in ['pkg==1.0', 'pkg==1.0 --hash=sha256:short', 'pkg==1.0 ' + HASH + ' --trusted-host=example.com']:
            with self.subTest(text=text), self.assertRaises(ValueError):
                read_pins(text, hashes=True)

    def test_unpinned_duplicate_remote_and_incomplete_entries_fail(self):
        for text in ['pkg>=1.0', 'pkg==1.0\npkg==2.0', 'pkg @ https://example.com/pkg.whl', 'pkg==1.0 \\', '']:
            with self.subTest(text=text), self.assertRaises(ValueError):
                read_pins(text)

    def test_installed_transitive_versions_are_verified(self):
        with tempfile.TemporaryDirectory() as root:
            self.fixture(root, locked='my-package==1.2.3 ' + HASH + '\ntransitive==2.0 ' + HASH)
            with patch('check_dependencies.importlib.metadata.version', side_effect=['1.2.3', '1.9']):
                with self.assertRaisesRegex(ValueError, 'Installed dependency mismatch: transitive'):
                    check(root, installed=True)

    def test_repository_manifest_and_lock_match(self):
        self.assertGreater(check(), 0)
