#!/usr/bin/env python3
"""Configure Gmail SMTP only on the explicitly authorized Supabase Preview."""
import getpass
import json
import os
import smtplib
import ssl
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

PROJECT = 'kulvagylilutnpckpiuw'
ROOT = Path(__file__).resolve().parent.parent

def run_cli(action, workdir, env):
    args = ['npx', 'supabase', 'config', action, '--project-ref', PROJECT,
            '--workdir', str(workdir), '--output-format', 'json']
    if action == 'push':
        args.append('--yes')
    try:
        result = subprocess.run(args, cwd=ROOT, env=env, capture_output=True,
                                text=True, timeout=120, check=False)
    except subprocess.TimeoutExpired:
        raise RuntimeError('La CLI agotó el tiempo durante config ' + action + '. Revisar el estado remoto antes de reintentar.') from None
    except OSError:
        raise RuntimeError('No se pudo iniciar la CLI de Supabase. Revisá que npm/npx estén disponibles.') from None
    # Never print raw CLI output: it may contain configuration or secret fields.
    if result.returncode:
        raise RuntimeError('La CLI no pudo completar config ' + action + '.')
    try:
        data = json.loads(result.stdout)
    except ValueError:
        raise RuntimeError('La CLI no devolvió JSON válido durante config ' + action + '. Su salida se omitió para proteger secretos.') from None
    if not isinstance(data, dict):
        raise RuntimeError('La CLI devolvió un formato inesperado durante config ' + action + '.')
    if data.get('error'):
        raise RuntimeError('La CLI informó un error en config ' + action + '.')
    return data

def main():
    if not sys.stdin.isatty():
        raise RuntimeError('Ejecutá este script vos desde una terminal interactiva.')
    if (ROOT / 'supabase/.temp/project-ref').read_text().strip() != PROJECT:
        raise RuntimeError('El proyecto vinculado no es el Preview autorizado.')
    print('Configura únicamente Supabase Preview; Production no se modifica.')
    print('La contraseña de aplicación se enviará a Google para validarla y a Supabase para enviar correos.')
    print('No se guardará en archivos locales, Git, Vercel ni argumentos de comandos.')
    sender = input('Tu dirección Gmail remitente: ').strip().lower()
    if not sender.endswith('@gmail.com') or len(sender) > 254 or any(c.isspace() for c in sender):
        raise RuntimeError('Ingresá tu dirección personal de Gmail.')
    password = getpass.getpass('Contraseña de aplicación de Google (oculta, no la habitual): ').replace(' ', '')
    if len(password) != 16 or not password.isascii() or not password.isalnum():
        raise RuntimeError('Se espera la contraseña de aplicación de 16 caracteres de Google.')
    phase = 'validación SMTP'
    env = dict(os.environ)
    try:
        # Authenticate over TLS, but do not send a test message.
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20,
                              context=ssl.create_default_context()) as smtp:
            smtp.login(sender, password)
        print('Credencial SMTP aceptada por Google. No se envió ningún correo.')
        phase = 'configuración Supabase'
        env['FDP_SMTP_PASSWORD'] = password
        with tempfile.TemporaryDirectory(prefix='fdp-smtp-') as tmp:
            directory = Path(tmp) / 'supabase'
            directory.mkdir(mode=0o700)
            config = '\n'.join([
                'project_id = "fuera-de-plan-preview"',
                '[auth.email]', 'enable_confirmations = true',
                '[auth.email.smtp]', 'enabled = true',
                'host = "smtp.gmail.com"', 'port = 465',
                'user = ' + json.dumps(sender),
                'pass = "env(FDP_SMTP_PASSWORD)"',
                'admin_email = ' + json.dumps(sender),
                'sender_name = "Fuera de Plan (pruebas)"', '',
            ])
            (directory / 'config.toml').write_text(config)
            diff = run_cli('diff', tmp, env)
            for change in diff.get('changes', []):
                if change.get('declared') and change['class'] == 'update':
                    path = change['path']
                    if path[:3] != ['auth', 'email', 'smtp'] and path != ['auth', 'email', 'enable_confirmations']:
                        raise RuntimeError('Se detectó un cambio ajeno a SMTP; operación detenida.')
            result = run_cli('push', tmp, env)
            secrets = result.get('secrets', {})
            if secrets.get('gated') or secrets.get('not_set') or secrets.get('unencodable') or secrets.get('skipped'):
                raise RuntimeError('La CLI no confirmó el envío del secreto SMTP; revisar antes de registrar usuarios.')
            verified = run_cli('diff', tmp, env)
            for change in verified.get('changes', []):
                if change.get('declared') and change['class'] == 'update' and change['path'] != ['auth', 'email', 'smtp', 'pass']:
                    raise RuntimeError('Quedó una propiedad SMTP pendiente; revisar configuración.')
        report = {'project_ref': PROJECT, 'smtp_host': 'smtp.gmail.com',
                  'smtp_port': 465, 'smtp_login_checked': True,
                  'email_confirmation_enabled': True, 'email_delivery_tested': False,
                  'checked_at': datetime.now(timezone.utc).isoformat()}
        (ROOT / 'supabase/.temp/smtp-check.json').write_text(json.dumps(report, indent=2) + '\n')
        print('SMTP de Preview configurado. Falta comprobar la entrega con tu registro cliente.')
    except (smtplib.SMTPException, OSError, subprocess.SubprocessError, ValueError) as error:
        raise RuntimeError('No se completó la etapa: ' + phase + '. No se muestran detalles sensibles.') from None
    finally:
        env.pop('FDP_SMTP_PASSWORD', None)
        password = ''

if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print('\nOperación interrumpida. Si ocurrió durante el envío, revisar el estado remoto.')
        sys.exit(130)
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
