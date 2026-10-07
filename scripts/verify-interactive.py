#!/usr/bin/env python3
"""User-run terminal entrypoint: hidden passwords, no credential files or arguments."""
import getpass
import json
import subprocess
import sys
from pathlib import Path

if not sys.stdin.isatty():
    sys.exit('Ejecutá este script vos desde una terminal interactiva. No pegues contraseñas en el chat.')
root = Path(__file__).resolve().parent.parent
print('Requiere dos cuentas propias confirmadas (cliente y admin) y npm run dev en localhost:3000.')
print('Se prueba la base de Preview. No crea usuarios ni envía correos.')
accounts = {}
try:
    for role, label in [('CLIENT', 'cliente'), ('ADMIN', 'administrador')]:
        email = input(f'Email de {label}: ').strip()
        password = getpass.getpass(f'Contraseña de {label} (oculta): ')
        accounts[role] = {'email': email, 'password': password}
    result = subprocess.run(
        ['node', '--env-file=.env.local', 'scripts/verify-interactive.mjs'],
        cwd=root, input=json.dumps(accounts), text=True, check=False,
    )
    sys.exit(result.returncode)
except (KeyboardInterrupt, EOFError):
    print('\nPrueba cancelada. No se guardaron credenciales.')
    sys.exit(130)
finally:
    accounts.clear()
