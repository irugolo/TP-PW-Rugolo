#!/usr/bin/env python3
"""Store webhook secret only in branch-scoped Vercel Preview through stdin."""
import getpass
import subprocess
import sys
if not sys.stdin.isatty():
    sys.exit('Ejecutá este comando en tu terminal zsh.')
print('Solo Preview de feat/e4-e6-checkout-pro. No modifica producción.')
secret = getpass.getpass('Clave secreta del webhook de la aplicación Mercado Pago (oculta): ').strip()
if not secret or len(secret)>500 or any(c.isspace() for c in secret):
    sys.exit('Clave vacía o con formato inválido. No se guardó.')
try:
    result = subprocess.run(['npx','vercel','env','add','MP_WEBHOOK_SECRET','preview','feat/e4-e6-checkout-pro'], input=secret+'\n',text=True,capture_output=True,timeout=90)
    if result.returncode:
        sys.exit('No se pudo guardar la variable; detalles omitidos. Avisá para revisar, no compartas la clave.')
    print('Webhook secret guardado solo en la rama Preview. Falta redesplegar para activarlo.')
except (OSError,subprocess.TimeoutExpired):
    sys.exit('No se confirmó la operación. Avisá para verificar el estado antes de repetir.')
finally:
    secret=''
