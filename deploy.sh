#!/usr/bin/env bash
# saasumkm deploy — git-based. Jalankan di VPS: bash deploy.sh
# Alur: Lokal edit+commit+push -> GitHub (sumber kebenaran) -> VPS pull+build+up
set -euo pipefail
cd "$(dirname "$0")"

echo "==> [1/5] Pull kode terbaru dari GitHub"
git fetch --quiet origin main
BEFORE=$(git rev-parse HEAD)
git reset --hard origin/main
AFTER=$(git rev-parse HEAD)
if [ "$BEFORE" = "$AFTER" ]; then echo "    (sudah terbaru: $AFTER)"; else echo "    $BEFORE -> $AFTER"; fi

echo "==> [2/5] Cek .env ada (secret produksi, di luar git)"
test -f .env || { echo "FATAL: .env hilang. Restore dari backup."; exit 1; }

echo "==> [3/5] Build image (provenance=false wajib utk Next standalone)"
DOCKER_BUILDKIT=1 docker build --provenance=false -t saasumkm-web --target runner .

echo "==> [4/5] Up (migrate one-shot chown + web), recreate bila image berubah"
docker compose up -d

echo "==> [5/5] Tunggu health + smoke test"
sleep 8
for i in $(seq 1 12); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8093/api/health || echo 000)
  [ "$CODE" = "200" ] && { echo "    health OK ($CODE)"; break; }
  echo "    waiting health... ($CODE) [$i/12]"; sleep 5
done
if [ "${CODE:-000}" != "200" ]; then
  echo "FATAL: health check gagal setelah 12 percobaan."
  docker compose logs --tail=100 web
  exit 1
fi
curl -fsS http://127.0.0.1:8093/api/health
echo ""
echo "==> Selesai. Container:"
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
