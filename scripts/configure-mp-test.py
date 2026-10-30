#!/usr/bin/env python3
"""Capture test seller credentials locally; never print them or send a payment."""
import getpass
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.request import Request, urlopen


def credential_state(identity):
    if identity.get('site_id') != 'MLA':
        raise RuntimeError('La API no confirmó una cuenta argentina. No se guardó el token.')
    user_id = str(identity.get('id', ''))
    if not user_id.isdigit():
        raise RuntimeError('Identificador devuelto por Mercado Pago inválido.')
    verified = 'test_user' in (identity.get('tags') or [])
    return user_id, verified


def main():
    if not sys.stdin.isatty():
        raise RuntimeError('Ejecutá este asistente en tu terminal interactiva.')
    root = Path(__file__).resolve().parent.parent
    target = root / '.env.mercadopago.local'
    if target.exists():
        raise RuntimeError('Ya existe .env.mercadopago.local. No se sobrescribió; avisá para verificar la configuración existente.')
    if subprocess.run(['git', 'check-ignore', '--quiet', str(target)], cwd=root).returncode:
        raise RuntimeError('El archivo no está excluido de Git; operación detenida.')
    print('Copiá el Access Token de Tu aplicación > Pruebas > Credenciales de prueba, NO de Credenciales de producción.')
    token = getpass.getpass('Access Token del vendedor de prueba (oculto): ').strip()
    if not re.fullmatch(r'[A-Za-z0-9_-]{20,500}', token):
        raise RuntimeError('Formato inválido. Copiá solamente el Access Token, sin comillas.')
    request = Request('https://api.mercadopago.com/users/me', headers={'Authorization': 'Bearer ' + token})
    try:
        with urlopen(request, timeout=20) as response:
            seller = json.load(response)
    except Exception:
        raise RuntimeError('No se pudo verificar el vendedor en Mercado Pago. No se guardó el token.') from None
    seller_id, verified = credential_state(seller)
    fd, temporary = tempfile.mkstemp(prefix='.env.mp-', dir=root)
    try:
        with os.fdopen(fd, 'w') as output:
            output.write('MP_TEST_ACCESS_TOKEN=' + token + '\nMP_TEST_SELLER_ID=' + (seller_id if verified else '') + '\nMP_TEST_MODE=' + ('true' if verified else 'false') + '\n')
        os.link(temporary, target)  # fail rather than overwrite an existing file
    finally:
        os.unlink(temporary)
    print('Credencial guardada en .env.mercadopago.local con permisos privados.')
    if verified:
        print('La API confirmó vendedor de prueba argentino.')
    else:
        print('Credencial aceptada para revisión: la identidad consultada no confirma vendedor de prueba. No se rechaza por la cuenta propietaria; checkout permanece deshabilitado hasta verificar la asociación con el vendedor de prueba.')
    print('No se creó ninguna preferencia ni pago. Webhook secret y URL Preview se configurarán después.')

if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        sys.exit('Cancelado; no compartas credenciales en el chat.')
    except RuntimeError as error:
        sys.exit(str(error))
