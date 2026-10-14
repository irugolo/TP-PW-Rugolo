import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('mp_setup', Path(__file__).resolve().parents[1] / 'scripts/configure-mp-test.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class CredentialTests(unittest.TestCase):
    def test_test_seller(self):
        self.assertEqual(module.credential_state({'id':123,'site_id':'MLA','tags':['test_user']}),('123',True))
    def test_owner_without_test_tag_is_pending_not_rejected(self):
        self.assertEqual(module.credential_state({'id':456,'site_id':'MLA','tags':None}),('456',False))
    def test_wrong_country_rejected(self):
        with self.assertRaises(RuntimeError):
            module.credential_state({'id':123,'site_id':'MLB','tags':['test_user']})
if __name__ == '__main__':
    unittest.main()
