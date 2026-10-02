import copy
import datetime
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from packs import expand_packs, load_packs, read_yaml
from generate import compose, load_profile, required_variables

TEST_TEMP = Path(__file__).resolve().parents[1] / "test-results"
TEST_TEMP.mkdir(exist_ok=True)
TODAY = datetime.date(2026, 10, 2)
PACK = {
    "jurisdiction": "test", "name": "Test", "last_reviewed": "2026-09-01",
    "needs_legal_review": True, "reviewed_by": "unverified", "rtl": False,
    "languages": ["en"], "consent_model": "opt_in",
    "frameworks": [{"id": "rule", "name": "Example rule", "governs": ["privacy"],
                    "citation": "https://example.com/rule", "verified": False}],
}


class PackTests(unittest.TestCase):
    def check_pack(self, modify=lambda p: None, raw=None, strict=None):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as directory:
            data = copy.deepcopy(PACK)
            modify(data)
            Path(directory, "test.yaml").write_text(raw or json.dumps(data), encoding="utf-8")
            return load_packs(directory, today=TODAY, strict_stale=strict)

    def test_shipped_packs_validate_and_california_inherits_federal(self):
        packs, errors, _ = load_packs(today=TODAY)
        self.assertEqual(errors, [])
        self.assertEqual(expand_packs(["us-ca", "us"], packs), ["us", "us-ca"])

    def test_each_framework_needs_its_own_citation(self):
        def modify(pack):
            pack["frameworks"].append({"id": "uncited", "name": "Uncited", "governs": ["privacy"], "verified": False})
        self.assertTrue(self.check_pack(modify)[1])

    def test_duplicate_yaml_keys_fail(self):
        self.assertTrue(self.check_pack(raw="jurisdiction: test\njurisdiction: other\n")[1])

    def test_invalid_yaml_fails(self):
        self.assertTrue(self.check_pack(raw="frameworks: [broken")[1])

    def test_duplicate_framework_ids_fail(self):
        self.assertTrue(self.check_pack(lambda p: p["frameworks"].append(copy.deepcopy(p["frameworks"][0])))[1])

    def test_boolean_strings_fail(self):
        self.assertTrue(self.check_pack(lambda p: p.update(needs_legal_review="false"))[1])

    def test_future_review_date_fails(self):
        self.assertTrue(self.check_pack(lambda p: p.update(last_reviewed="2027-01-01"))[1])

    def test_invalid_effective_date_fails(self):
        self.assertTrue(self.check_pack(lambda p: p["frameworks"][0].update(effective="2026-02-30"))[1])

    def test_non_web_citation_fails(self):
        self.assertTrue(self.check_pack(lambda p: p["frameworks"][0].update(citation="javascript:alert(1)"))[1])

    def test_missing_parent_fails(self):
        self.assertTrue(self.check_pack(lambda p: p.update(extends="absent"))[1])

    def test_inheritance_cycle_fails(self):
        self.assertTrue(self.check_pack(lambda p: p.update(extends="test"))[1])

    def test_signoff_without_reviewer_fails(self):
        self.assertTrue(self.check_pack(lambda p: p.update(needs_legal_review=False))[1])

    def test_stale_reviews_are_errors_in_strict_mode(self):
        errors = self.check_pack(lambda p: p.update(last_reviewed="2025-01-01"), strict=180)[1]
        self.assertTrue(any("freshness limit" in e for e in errors))


class GeneratorTests(unittest.TestCase):
    def profile(self, jurisdictions=None):
        return {"profile_version": 1, "name": "Synthetic example", "language": "en",
                "jurisdictions": jurisdictions or ["eu"],
                "variables": {key: "NO" if key in {"GA4", "GOOGLE_ADS", "FB_PIXEL", "MAILCHIMP"} else "Synthetic value"
                              for key in required_variables("cookie-banner")}}

    def test_deterministic_output_and_manifest(self):
        a = compose(self.profile(), "cookie-banner", TODAY)
        b = compose(self.profile(), "cookie-banner", TODAY)
        self.assertEqual(a, b)
        self.assertEqual(a[1]["status"], "draft_for_review")
        self.assertEqual(a[1]["missing_variables"], [])
        self.assertIn("2026-10-02", a[0])
        self.assertNotIn("[TODAY'S DATE]", a[0])

    def test_missing_business_facts_fail_by_default(self):
        profile = self.profile()
        del profile["variables"]["CONTACT_EMAIL"]
        with self.assertRaisesRegex(ValueError, "CONTACT_EMAIL"):
            compose(profile, "cookie-banner", TODAY)
        prompt, manifest = compose(profile, "cookie-banner", TODAY, allow_missing=True)
        self.assertEqual(manifest["status"], "incomplete")
        self.assertIn("[MISSING: CONTACT_EMAIL]", prompt)

    def test_unsupported_market_fails(self):
        with self.assertRaisesRegex(ValueError, "Unsupported jurisdiction"):
            compose(self.profile(["br"]), "cookie-banner", TODAY)

    def test_parent_sources_and_multi_market_conflicts_are_included(self):
        prompt, manifest = compose(self.profile(["eu", "us-ca"]), "cookie-banner", TODAY)
        self.assertEqual([p["code"] for p in manifest["packs"]], ["eu", "us", "us-ca"])
        self.assertTrue(manifest["conflicts"])
        self.assertIn("https://oag.ca.gov/privacy/ccpa", prompt)
        self.assertTrue(manifest["warnings"])

    def test_legacy_template_cannot_silently_expand_legal_scope(self):
        with self.assertRaisesRegex(ValueError, "Israel-specific"):
            compose(self.profile(), "privacy-policy", TODAY)

    def test_artifact_overrides_and_rtl(self):
        profile = self.profile(["il"])
        profile["language"] = "he"
        profile["artifacts"] = {"cookie-banner": {"WEBSITE_NAME": "Example override"}}
        prompt, manifest = compose(profile, "cookie-banner", TODAY)
        self.assertIn("Example override", prompt)
        self.assertEqual(manifest["direction"], "rtl")

    def test_invalid_profile_language_fails_schema(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as directory:
            path = Path(directory, "profile.json")
            profile = self.profile()
            profile["language"] = "unsupported"
            path.write_text(json.dumps(profile), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Invalid profile"):
                load_profile(path)

    def test_path_traversal_is_not_an_artifact(self):
        with self.assertRaisesRegex(ValueError, "Unknown artifact"):
            required_variables("../../README")


if __name__ == "__main__":
    unittest.main()
