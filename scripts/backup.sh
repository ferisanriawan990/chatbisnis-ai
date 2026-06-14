#!/bin/bash
# Database Backup Script for Postgres
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="db_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Please set it or run this script via: DATABASE_URL=... ./scripts/backup.sh"
  exit 1
fi

echo "Starting database backup..."
pg_dump "$DATABASE_URL" -f "$BACKUP_DIR/$FILENAME"
echo "Backup successfully saved to $BACKUP_DIR/$FILENAME"

# Optional: compress the backup
gzip "$BACKUP_DIR/$FILENAME"
echo "Backup compressed to $BACKUP_DIR/$FILENAME.gz"
