#!/usr/bin/env python3
"""Configure the signed webhook only in Supabase Preview and Vercel's E4/E6 branch."""
import getpass
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
PREVIEW = 'kulvagylilutnpckpiuw'
BRANCH = 'feat/e4-e6-checkout-pro'

def run(args, value=None):
    result = subprocess.run(args, cwd=ROOT, input=value, text=True, capture_output=True, timeout=90)
    if result.returncode:
        raise RuntimeError('No se confirmó la configuración. Avisá para revisar; no compartas la clave.')

def main():
    if not sys.stdin.isatty():
        raise RuntimeError('Ejecutá este comando en tu terminal zsh.')
    print('Solo Supabase Preview y la rama E4/E6 de Vercel. Producción no se modifica.')
    print('Ingresá la clave de firma de Webhooks de la misma aplicación Mercado Pago del vendedor de prueba.')
    secret = getpass.getpass('Clave secreta del webhook (oculta): ').strip()
    if not re.fullmatch(r'[A-Za-z0-9_-]{16,500}', secret):
        raise RuntimeError('Formato inválido; copiá solo la clave de firma, sin espacios ni comillas.')
    # mkstemp uses mode 0600. Context cleanup also runs on SIGINT/SIGTERM and errors.
    with tempfile.TemporaryDirectory(prefix='fdp-webhook-') as directory:
        fd, filename = tempfile.mkstemp(dir=directory)
        with os.fdopen(fd,'w') as output:
            output.write('MP_WEBHOOK_SECRET='+secret+'\n')
        run(['npx','supabase','secrets','set','--project-ref',PREVIEW,'--env-file',filename])
    # The branch-only variable also gates creation of checkout preferences.
    listing = subprocess.run(['npx','vercel','env','ls','preview',BRANCH], cwd=ROOT, text=True, capture_output=True, timeout=90)
    if listing.returncode:
        raise RuntimeError('Clave guardada en Supabase Preview; falta verificar Vercel. Avisá antes de repetir.')
    action = 'update' if re.search(r'\bMP_WEBHOOK_SECRET\b',listing.stdout) else 'add'
    run(['npx','vercel','env',action,'MP_WEBHOOK_SECRET','preview',BRANCH] + (['--yes'] if action == 'update' else []), secret+'\n')
    print('Clave de firma configurada en Supabase Preview y Vercel Preview. Avisame este mensaje para redesplegar y verificar; todavía no hagas la compra.')

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, lambda *_: sys.exit('Cancelado; temporal eliminado.'))
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        sys.exit('Cancelado; temporal eliminado.')
    except (OSError, subprocess.TimeoutExpired):
        sys.exit('Operación no confirmada. Avisá para revisar el estado; no compartas secretos.')
    except RuntimeError as error:
        sys.exit(str(error))
