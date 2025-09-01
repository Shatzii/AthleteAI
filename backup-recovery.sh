#!/bin/bash

# Go4It Sports Platform Backup and Disaster Recovery Script
# This script handles automated backups, restores, and disaster recovery

set -e

# Configuration
BACKUP_DIR="/opt/go4it/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="go4it_backup_$TIMESTAMP"

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-27017}"
DB_NAME="${DB_NAME:-go4it}"
DB_USER="${DB_USER:-}"
DB_PASS="${DB_PASS:-}"

# AWS S3 configuration (if using cloud storage)
S3_BUCKET="${S3_BUCKET:-go4it-backups}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Logging
LOG_FILE="/var/log/go4it/backup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Create backup directory if it doesn't exist
setup_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory"
        chmod 700 "$BACKUP_DIR"
    fi
}

# Backup MongoDB database
backup_database() {
    log "Starting database backup..."

    if [ -n "$DB_USER" ] && [ -n "$DB_PASS" ]; then
        mongodump --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" --password "$DB_PASS" \
                  --db "$DB_NAME" --out "$BACKUP_DIR/$BACKUP_NAME/db" \
                  --gzip || error_exit "Database backup failed"
    else
        mongodump --host "$DB_HOST" --port "$DB_PORT" --db "$DB_NAME" \
                  --out "$BACKUP_DIR/$BACKUP_NAME/db" --gzip \
                  || error_exit "Database backup failed"
    fi

    log "Database backup completed"
}

# Backup application files
backup_files() {
    log "Starting file backup..."

    # Create backup directory structure
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/files"

    # Backup backend files (excluding node_modules and logs)
    rsync -av --exclude='node_modules' --exclude='*.log' --exclude='.git' \
          /opt/go4it/backend/ "$BACKUP_DIR/$BACKUP_NAME/files/backend/"

    # Backup frontend build files
    rsync -av /opt/go4it/frontend/build/ "$BACKUP_DIR/$BACKUP_NAME/files/frontend/"

    # Backup configuration files
    rsync -av /opt/go4it/config/ "$BACKUP_DIR/$BACKUP_NAME/files/config/"

    # Backup uploads directory
    rsync -av /opt/go4it/uploads/ "$BACKUP_DIR/$BACKUP_NAME/files/uploads/"

    log "File backup completed"
}

# Backup Docker volumes (if using Docker)
backup_docker_volumes() {
    log "Starting Docker volume backup..."

    # List of volumes to backup
    VOLUMES=("go4it_mongodb_data" "go4it_redis_data" "go4it_uploads")

    for volume in "${VOLUMES[@]}"; do
        if docker volume ls -q | grep -q "^${volume}$"; then
            log "Backing up volume: $volume"
            docker run --rm -v "$volume":/source -v "$BACKUP_DIR/$BACKUP_NAME/volumes":/backup \
                   alpine tar czf "/backup/${volume}.tar.gz" -C /source .
        fi
    done

    log "Docker volume backup completed"
}

# Upload backup to cloud storage
upload_to_s3() {
    if command -v aws &> /dev/null; then
        log "Uploading backup to S3..."

        aws s3 cp "$BACKUP_DIR/$BACKUP_NAME" "s3://$S3_BUCKET/$BACKUP_NAME/" \
            --recursive --region "$AWS_REGION" \
            || log "WARNING: S3 upload failed, but continuing..."

        log "S3 upload completed"
    else
        log "AWS CLI not found, skipping S3 upload"
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Remove local backups older than retention period
    find "$BACKUP_DIR" -name "go4it_backup_*" -type d -mtime +"$RETENTION_DAYS" \
         -exec rm -rf {} + 2>/dev/null || true

    # Remove old S3 backups if AWS CLI is available
    if command -v aws &> /dev/null; then
        aws s3 ls "s3://$S3_BUCKET/" | while read -r line; do
            createDate=$(echo "$line" | awk '{print $1" "$2}')
            createDate=$(date -d"$createDate" +%s)
            olderThan=$(date -d"-$RETENTION_DAYS days" +%s)

            if [ "$createDate" -lt "$olderThan" ]; then
                fileName=$(echo "$line" | awk '{print $4}')
                if [[ $fileName == go4it_backup_* ]]; then
                    aws s3 rm "s3://$S3_BUCKET/$fileName" --recursive
                fi
            fi
        done
    fi

    log "Cleanup completed"
}

# Restore database from backup
restore_database() {
    local backup_path="$1"

    if [ -z "$backup_path" ]; then
        error_exit "Backup path required for restore"
    fi

    log "Starting database restore from $backup_path..."

    # Stop application before restore
    docker-compose down || true

    # Restore database
    if [ -n "$DB_USER" ] && [ -n "$DB_PASS" ]; then
        mongorestore --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" \
                     --password "$DB_PASS" --db "$DB_NAME" --drop \
                     "$backup_path/db/$DB_NAME" --gzip \
                     || error_exit "Database restore failed"
    else
        mongorestore --host "$DB_HOST" --port "$DB_PORT" --db "$DB_NAME" --drop \
                     "$backup_path/db/$DB_NAME" --gzip \
                     || error_exit "Database restore failed"
    fi

    # Restart application
    docker-compose up -d

    log "Database restore completed"
}

# Restore files from backup
restore_files() {
    local backup_path="$1"

    if [ -z "$backup_path" ]; then
        error_exit "Backup path required for restore"
    fi

    log "Starting file restore from $backup_path..."

    # Restore backend files
    rsync -av "$backup_path/files/backend/" /opt/go4it/backend/

    # Restore frontend files
    rsync -av "$backup_path/files/frontend/" /opt/go4it/frontend/build/

    # Restore configuration
    rsync -av "$backup_path/files/config/" /opt/go4it/config/

    # Restore uploads
    rsync -av "$backup_path/files/uploads/" /opt/go4it/uploads/

    log "File restore completed"
}

# Disaster recovery function
disaster_recovery() {
    local backup_name="$1"

    if [ -z "$backup_name" ]; then
        error_exit "Backup name required for disaster recovery"
    fi

    log "Starting disaster recovery from backup: $backup_name"

    # Determine backup location
    if [ -d "$BACKUP_DIR/$backup_name" ]; then
        BACKUP_PATH="$BACKUP_DIR/$backup_name"
    elif command -v aws &> /dev/null; then
        # Download from S3
        log "Downloading backup from S3..."
        mkdir -p "$BACKUP_DIR/$backup_name"
        aws s3 cp "s3://$S3_BUCKET/$backup_name/" "$BACKUP_DIR/$backup_name/" \
            --recursive --region "$AWS_REGION"
        BACKUP_PATH="$BACKUP_DIR/$backup_name"
    else
        error_exit "Backup not found locally and AWS CLI not available"
    fi

    # Perform restore
    restore_database "$BACKUP_PATH"
    restore_files "$BACKUP_PATH"

    # Restore Docker volumes if they exist
    if [ -d "$BACKUP_PATH/volumes" ]; then
        log "Restoring Docker volumes..."
        for volume_file in "$BACKUP_PATH/volumes"/*.tar.gz; do
            if [ -f "$volume_file" ]; then
                volume_name=$(basename "$volume_file" .tar.gz)
                docker run --rm -v "$volume_name":/target -v "$BACKUP_PATH/volumes":/source \
                       alpine tar xzf "/source/$(basename "$volume_file")" -C /target
            fi
        done
    fi

    log "Disaster recovery completed successfully"
}

# Health check after restore
health_check() {
    log "Performing health check..."

    # Wait for services to be ready
    sleep 30

    # Check database connectivity
    if command -v mongosh &> /dev/null; then
        if [ -n "$DB_USER" ] && [ -n "$DB_PASS" ]; then
            mongosh --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" \
                    --password "$DB_PASS" --eval "db.stats()" "$DB_NAME" \
                    >/dev/null 2>&1 || error_exit "Database health check failed"
        else
            mongosh --host "$DB_HOST" --port "$DB_PORT" \
                    --eval "db.stats()" "$DB_NAME" \
                    >/dev/null 2>&1 || error_exit "Database health check failed"
        fi
    fi

    # Check application health endpoint
    curl -f http://localhost:3000/health >/dev/null 2>&1 \
         || log "WARNING: Backend health check failed"

    curl -f http://localhost:3001 >/dev/null 2>&1 \
         || log "WARNING: Frontend health check failed"

    log "Health check completed"
}

# Main backup function
perform_backup() {
    log "Starting Go4It backup process..."

    setup_backup_dir
    backup_database
    backup_files
    backup_docker_volumes
    upload_to_s3
    cleanup_old_backups

    log "Backup process completed successfully: $BACKUP_NAME"

    # Print backup summary
    echo "Backup Summary:"
    echo "  Name: $BACKUP_NAME"
    echo "  Location: $BACKUP_DIR/$BACKUP_NAME"
    echo "  Size: $(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)"
    echo "  Retention: $RETENTION_DAYS days"
}

# Main function
main() {
    case "$1" in
        backup)
            perform_backup
            ;;
        restore)
            if [ -z "$2" ]; then
                echo "Usage: $0 restore <backup_name>"
                exit 1
            fi
            restore_database "$BACKUP_DIR/$2"
            restore_files "$BACKUP_DIR/$2"
            health_check
            ;;
        disaster-recovery)
            if [ -z "$2" ]; then
                echo "Usage: $0 disaster-recovery <backup_name>"
                exit 1
            fi
            disaster_recovery "$2"
            health_check
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 {backup|restore|disaster-recovery|cleanup} [backup_name]"
            echo ""
            echo "Commands:"
            echo "  backup              - Create a new backup"
            echo "  restore <name>      - Restore from a local backup"
            echo "  disaster-recovery <name> - Full disaster recovery from backup"
            echo "  cleanup             - Remove old backups"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
