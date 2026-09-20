#!/usr/bin/env bash
# Nightly PostgreSQL backup. Install with:
#   0 2 * * * /opt/company-management/scripts/backup.sh >> /var/log/cms-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/company-management}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CONTAINER="${CONTAINER:-company-management-postgres-1}"
DB_USER="${POSTGRES_USER:-cms_app}"
DB_NAME="${POSTGRES_DB:-cms}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# --clean lets the dump restore over an existing database.
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  | gzip > "$BACKUP_DIR/cms-$STAMP.sql.gz"

echo "Backup written: $BACKUP_DIR/cms-$STAMP.sql.gz"

find "$BACKUP_DIR" -name 'cms-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
echo "Removed backups older than $RETENTION_DAYS days"
