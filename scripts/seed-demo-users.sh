#!/usr/bin/env bash
# Demo hesapları Supabase Auth'a yükler (service role gerekir).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." >&2
  echo "Örnek: export SUPABASE_SERVICE_ROLE_KEY=\$(supabase projects api-keys --project-ref assrdrngdkkmmoaxaeke -o json | jq -r '.[] | select(.name==\"service_role\") | .api_key')" >&2
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-assrdrngdkkmmoaxaeke}"
BASE="https://${PROJECT_REF}.supabase.co/auth/v1/admin/users"

create_user() {
  local email="$1"
  local password="$2"
  local username="$3"
  local role="$4"

  curl -sS -X POST "$BASE" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg email "$email" \
      --arg password "$password" \
      --arg username "$username" \
      --arg role "$role" \
      '{
        email: $email,
        password: $password,
        email_confirm: true,
        user_metadata: { username: $username, role: $role }
      }')" \
    | jq -r '.id // .msg // .error_description // .' 2>/dev/null || true
  echo " → $email ($role)"
}

echo "Demo kullanıcıları oluşturuluyor…"
create_user "admin@modigrid.app" "modigrid2024" "admin" "admin"

for i in $(seq 1 10); do
  create_user "daire${i}@modigrid.app" "1234" "daire${i}" "resident"
done

echo "Tamam."
