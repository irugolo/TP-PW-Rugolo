"""No network or credentials: regression tests for the user-run CLI adapter."""
import importlib.util
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('configure_smtp', Path(__file__).resolve().parents[1] / 'scripts/configure-preview-smtp.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CliOutputTests(unittest.TestCase):
    def test_explicit_json_independent_of_agent_environment(self):
        response = subprocess.CompletedProcess([], 0, '{"changes": []}', '')
        with patch.object(module.subprocess, 'run', return_value=response) as run:
            self.assertEqual(module.run_cli('diff', '/tmp/test-only', {}), {'changes': []})
        args = run.call_args.args[0]
        self.assertEqual(args[args.index('--output-format') + 1], 'json')
        self.assertNotIn('--yes', args)

    def test_push_is_explicit_and_secret_stays_out_of_arguments(self):
        response = subprocess.CompletedProcess([], 0, '{"services": []}', '')
        with patch.object(module.subprocess, 'run', return_value=response) as run:
            module.run_cli('push', '/tmp/test-only', {'FDP_SMTP_PASSWORD': 'FAKE-TEST-SECRET'})
        args = run.call_args.args[0]
        self.assertIn('--yes', args)
        self.assertNotIn('FAKE-TEST-SECRET', ' '.join(args))

    def test_invalid_output_never_echoes_credential(self):
        response = subprocess.CompletedProcess([], 0, 'FAKE-TEST-SECRET', '')
        with patch.object(module.subprocess, 'run', return_value=response):
            with self.assertRaises(RuntimeError) as raised:
                module.run_cli('diff', '/tmp/test-only', {})
        self.assertIn('JSON', str(raised.exception))
        self.assertNotIn('FAKE-TEST-SECRET', str(raised.exception))

    def test_failure_never_echoes_cli_output(self):
        response = subprocess.CompletedProcess([], 1, 'FAKE-TEST-SECRET', 'FAKE-TEST-SECRET')
        with patch.object(module.subprocess, 'run', return_value=response):
            with self.assertRaises(RuntimeError) as raised:
                module.run_cli('push', '/tmp/test-only', {})
        self.assertNotIn('FAKE-TEST-SECRET', str(raised.exception))

    def test_timeout_is_distinguished_without_raw_output(self):
        with patch.object(module.subprocess, 'run', side_effect=subprocess.TimeoutExpired('test', 120, output='FAKE-TEST-SECRET')):
            with self.assertRaises(RuntimeError) as raised:
                module.run_cli('push', '/tmp/test-only', {})
        self.assertIn('agotó el tiempo', str(raised.exception))
        self.assertNotIn('FAKE-TEST-SECRET', str(raised.exception))

class ProductionTargetTests(unittest.TestCase):
    def test_smtp_diagnostics_do_not_expose_raw_errors(self):
        production_spec = importlib.util.spec_from_file_location('configure_production_smtp', Path(__file__).resolve().parents[1] / 'scripts/configure-production-smtp.py')
        production = importlib.util.module_from_spec(production_spec)
        production_spec.loader.exec_module(production)
        cases = [
            (production.smtplib.SMTPAuthenticationError(535, b'FAKE-SECRET'), 'rechazó la autenticación'),
            (production.ssl.SSLError('FAKE-SECRET'), 'conexión segura'),
            (TimeoutError('FAKE-SECRET'), 'agotó el tiempo'),
            (OSError('FAKE-SECRET'), 'comunicación'),
        ]
        for error, expected in cases:
            with self.subTest(expected=expected), patch.object(production.smtplib, 'SMTP_SSL', side_effect=error):
                with self.assertRaises(RuntimeError) as raised:
                    production.validate_smtp('test@gmail.com', 'FAKE-SECRET')
                self.assertIn(expected, str(raised.exception))
                self.assertNotIn('FAKE-SECRET', str(raised.exception))

    def test_production_target_is_explicit_and_preview_stays_separate(self):
        production_spec = importlib.util.spec_from_file_location('configure_production_smtp', Path(__file__).resolve().parents[1] / 'scripts/configure-production-smtp.py')
        production = importlib.util.module_from_spec(production_spec)
        production_spec.loader.exec_module(production)
        response = subprocess.CompletedProcess([], 0, '{"changes": []}', '')
        with patch.object(production.subprocess, 'run', return_value=response) as run:
            production.run_cli('diff', '/tmp/test-only', {})
        args = run.call_args.args[0]
        self.assertEqual(args[args.index('--project-ref') + 1], 'lvkglhdckvnkixglyvms')
        self.assertEqual(module.PROJECT, 'kulvagylilutnpckpiuw')
        self.assertNotIn('--linked', args)

if __name__ == '__main__':
    unittest.main()
