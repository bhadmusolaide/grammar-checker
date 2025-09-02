#!/bin/bash

# Production Deployment Script for AI Grammar Checker
# Usage: ./deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
APP_NAME="ai-grammar-checker"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log "[INFO] $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log "[SUCCESS] $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log "[WARNING] $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "[ERROR] $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose."
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        error "Environment file .env.${ENVIRONMENT} not found."
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup environment files
    cp .env.* "$BACKUP_PATH/" 2>/dev/null || true
    
    # Backup uploads and logs if they exist
    if [ -d "backend/uploads" ]; then
        cp -r backend/uploads "$BACKUP_PATH/"
    fi
    
    if [ -d "backend/logs" ]; then
        cp -r backend/logs "$BACKUP_PATH/"
    fi
    
    # Create database backup if applicable
    # Add your database backup commands here
    
    success "Backup created at $BACKUP_PATH"
}

# Build and deploy
deploy() {
    info "Starting deployment for environment: $ENVIRONMENT"
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" ".env.production"
    
    # Build and start services
    info "Building Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    info "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    success "Deployment completed successfully"
}

# Health check
check_health() {
    info "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/health &> /dev/null; then
            success "Application is healthy"
            return 0
        fi
        
        warning "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Rollback function
rollback() {
    warning "Rolling back deployment..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore from latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        info "Restoring from backup: $LATEST_BACKUP"
        # Add restore logic here
    fi
    
    success "Rollback completed"
}

# Cleanup old backups (keep last 5)
cleanup_backups() {
    info "Cleaning up old backups..."
    
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        cd ..
    fi
    
    success "Backup cleanup completed"
}

# Show usage
show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  production (default)"
    echo "  staging"
    echo ""
    echo "Options:"
    echo "  --no-backup    Skip backup creation"
    echo "  --rollback     Rollback to previous version"
    echo "  --health-only  Only perform health check"
    echo "  --help         Show this help message"
}

# Main execution
main() {
    info "Starting deployment script for $APP_NAME"
    
    case "${2:-}" in
        --rollback)
            rollback
            exit 0
            ;;
        --health-only)
            check_health
            exit 0
            ;;
        --help)
            show_usage
            exit 0
            ;;
    esac
    
    check_prerequisites
    
    if [ "${2:-}" != "--no-backup" ]; then
        create_backup
    fi
    
    deploy
    cleanup_backups
    
    success "Deployment completed successfully!"
    info "Application is running at: http://localhost (HTTP) and https://localhost (HTTPS)"
    info "API is available at: http://localhost/api"
    info "Logs can be viewed with: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
}

# Trap errors and rollback
trap 'error "Deployment failed. Consider running with --rollback option."' ERR

# Run main function
main "$@"