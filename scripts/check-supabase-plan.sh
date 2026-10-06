#!/bin/sh
# Read-only Management API check. Never run with shell tracing enabled.
set +x
set -eu
umask 077
cd -- "$(dirname -- "$0")/.."

fdp_tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/fuera-de-plan.XXXXXXXX")
cleanup() {
  rm -rf -- "$fdp_tmp_dir"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

printf '%s\n' 'Autorizá el acceso a «Supabase CLI» si macOS lo solicita.'
if ! security find-generic-password -s 'Supabase CLI' -w > "$fdp_tmp_dir/token" 2>/dev/null; then
  printf '%s\n' 'No se pudo leer la credencial del llavero. No se realizaron cambios.' >&2
  exit 1
fi
chmod 600 "$fdp_tmp_dir/token"

python3 - "$fdp_tmp_dir/token" <<'PY'
import json
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

org = 'rfyxdffzljibhrewgkwq'
token = Path(sys.argv[1]).read_text().strip()
if not token:
    sys.exit('La credencial está vacía. No se realizaron cambios.')

def get(path):
    request = Request('https://api.supabase.com/v1/' + path,
                      headers={'Authorization': 'Bearer ' + token})
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        sys.exit(f'La API respondió HTTP {error.code}. No se realizaron cambios.')
    except (URLError, TimeoutError, ValueError):
        sys.exit('No se pudo consultar la API. No se realizaron cambios.')

organization = get('organizations/' + org)
plan = organization.get('plan')
if plan != 'free':
    sys.exit('No se confirmó el plan Free. No se creará ningún proyecto.')

regions = get('projects/available-regions?organization_slug=' + org + '&continent=SA')
def matches(value):
    if isinstance(value, dict):
        if value.get('code') == 'sa-east-1':
            yield {k: value[k] for k in ('name', 'code', 'status') if k in value}
        for child in value.values():
            yield from matches(child)
    elif isinstance(value, list):
        for child in value:
            yield from matches(child)

sao_paulo = list(matches(regions))
result = {'organization_slug': org, 'plan': 'free', 'sao_paulo': sao_paulo}
# Only non-secret verification metadata, in the CLI's ignored local directory.
output = Path('supabase/.temp/org-check.json')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, indent=2) + '\n')
print('Plan Free confirmado para Fuera de Plan.')
print('Región São Paulo:', json.dumps(sao_paulo, ensure_ascii=False) if sao_paulo else 'no informada por la API; revisar antes de crear.')
print('Verificación guardada sin credenciales en supabase/.temp/org-check.json.')
PY
printf '%s\n' 'Consulta terminada. Se elimina la credencial temporal al salir.'
