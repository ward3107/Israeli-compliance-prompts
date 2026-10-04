import hashlib
import json
import tempfile
import unittest
import zipfile
import uuid
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from build_site import build, public_files


class DistributionTests(unittest.TestCase):
    def test_private_and_unlisted_local_files_are_not_published(self):
        private = ROOT / 'docs/site/private-review-test.json'
        try:
            secret = uuid.uuid4().hex
            private.write_text(json.dumps({'private': secret}))
            with tempfile.TemporaryDirectory() as directory:
                output = build(directory)
                self.assertFalse((output / private.name).exists())
                self.assertFalse(secret in (output / 'toolkit.json').read_text())
                with zipfile.ZipFile(output / 'web-compliance-studio.zip') as archive:
                    self.assertNotIn(private.name, archive.namelist())
                    self.assertIn('START-HERE.html', archive.namelist())
                    loader = archive.read('toolkit-loader.js').decode()
                    self.assertTrue(loader.startswith('window.ToolkitSource='))
                    self.assertIsNone(archive.testzip())
                self.assertIn(hashlib.sha256((output / 'web-compliance-studio.zip').read_bytes()).hexdigest(), (output / 'SHA256SUMS.txt').read_text())
                for page in output.glob('*.html'):
                    self.assertIn("script-src 'self'", page.read_text())
                    self.assertIn("form-action 'none'", page.read_text())
        finally:
            private.unlink(missing_ok=True)

    def test_symlink_cannot_redirect_a_build_write(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'site'
            output.mkdir()
            target = Path(directory) / 'private.txt'
            target.write_text('keep')
            (output / 'index.html').symlink_to(target)
            with self.assertRaisesRegex(ValueError, 'Symlink'):
                build(output)
            self.assertEqual(target.read_text(), 'keep')

    def test_public_catalog_contains_no_runtime_dependencies(self):
        package = json.loads(public_files()['package.json'])
        self.assertFalse(package.get('dependencies'))

    def test_unlisted_pack_cannot_bypass_the_public_source_allowlist(self):
        source = ROOT / 'skills/web-compliance/jurisdictions/private-test.yaml'
        try:
            source.write_text('private: test')
            with tempfile.TemporaryDirectory() as directory:
                with self.assertRaisesRegex(ValueError, 'Unlisted public build input'):
                    build(directory)
                self.assertFalse((Path(directory) / 'toolkit.json').exists())
        finally:
            source.unlink(missing_ok=True)

    def test_stale_private_output_is_preserved_but_blocks_publication(self):
        with tempfile.TemporaryDirectory() as directory:
            private = Path(directory) / 'private-review.json'
            private.write_text('keep private')
            with self.assertRaisesRegex(ValueError, 'Unexpected existing output'):
                build(directory)
            self.assertEqual(private.read_text(), 'keep private')


if __name__ == '__main__':
    unittest.main()
