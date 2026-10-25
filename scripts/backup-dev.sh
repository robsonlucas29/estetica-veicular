#!/usr/bin/env bash
# Logical off-site export preparation. Not scheduled until a private destination and DB URL are configured.
set -euo pipefail
umask 077
: "${GRAUCAR_DEV_DATABASE_URL:?Configure privately the development PostgreSQL URL}"
: "${GRAUCAR_BACKUP_DIRECTORY:?Choose a private off-site mounted directory}"
case "$GRAUCAR_DEV_DATABASE_URL" in
  *hgmmabtixqaztuswmivv*) ;;
  *) echo 'Refusing a database URL without the authorized development project reference.' >&2; exit 1;;
esac
command -v pg_dump >/dev/null
command -v pg_restore >/dev/null
mkdir -p "$GRAUCAR_BACKUP_DIRECTORY"
backup_file="$GRAUCAR_BACKUP_DIRECTORY/graucar-dev-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --dbname="$GRAUCAR_DEV_DATABASE_URL" --format=custom --no-owner --no-acl --file="$backup_file"
pg_restore --list "$backup_file" >/dev/null
printf 'Logical database dump created and archive readable. A full restore test and separate Storage object backup are still required.\n'
