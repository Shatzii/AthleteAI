#!/bin/bash
# Database backup script for Go4It Sports Platform

BACKUP_DIR="/opt/go4it/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="go4it_backup_$DATE"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec go4it-mongo mongodump --db go4it --out /backup/$BACKUP_NAME

# Copy backup to host
docker cp go4it-mongo:/backup/$BACKUP_NAME $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$BACKUP_NAME

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
