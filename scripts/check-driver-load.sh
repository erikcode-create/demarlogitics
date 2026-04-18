#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

set -a
if [[ -f "$ROOT_DIR/.env" ]]; then
  source "$ROOT_DIR/.env"
fi
if [[ -f "$ROOT_DIR/.env.local" ]]; then
  source "$ROOT_DIR/.env.local"
fi
set +a

: "${VITE_SUPABASE_URL:?Missing VITE_SUPABASE_URL in .env.local or .env}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?Missing VITE_SUPABASE_PUBLISHABLE_KEY in .env.local or .env}"

PHONE="${1:?Usage: bash ./scripts/check-driver-load.sh <driver_phone>}"
ACTIVE_STATUSES='dispatched,rate_con_signed,at_pickup,picked_up,in_transit,at_delivery,delivered,pod_submitted'

curl -s \
  "${VITE_SUPABASE_URL}/rest/v1/loads?select=id,load_number,status,driver_phone,driver_name,dispatched_at&driver_phone=eq.${PHONE}&status=in.(${ACTIVE_STATUSES})&order=pickup_date.asc" \
  -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}"

echo
