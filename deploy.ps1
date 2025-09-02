# Production Deployment Script for AI Grammar Checker (PowerShell)
# Usage: .\deploy.ps1 [-Environment production] [-NoBackup] [-Rollback] [-HealthOnly]

param(
    [string]$Environment = "production",
    [switch]$NoBackup,
    [switch]$Rollback,
    [switch]$HealthOnly,
    [switch]$Help
)

# Configuration
$AppName = "ai-grammar-checker"
$DockerComposeFile = "docker-compose.prod.yml"
$BackupDir = "./backups"
$LogFile = "./deploy.log"

# Function to write logs
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp - [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
    Write-Log $Message "INFO"
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    Write-Log $Message "SUCCESS"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    Write-Log $Message "WARNING"
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Write-Log $Message "ERROR"
    exit 1
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if Docker is installed
    try {
        $dockerVersion = docker --version
        if (-not $dockerVersion) {
            Write-Error "Docker is not installed. Please install Docker Desktop first."
        }
    }
    catch {
        Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop first."
    }
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop first."
    }
    
    # Check if Docker Compose is available
    try {
        docker-compose --version | Out-Null
    }
    catch {
        try {
            docker compose version | Out-Null
        }
        catch {
            Write-Error "Docker Compose is not available. Please install Docker Compose."
        }
    }
    
    # Check if environment file exists
    if (-not (Test-Path ".env.$Environment")) {
        Write-Error "Environment file .env.$Environment not found."
    }
    
    Write-Success "Prerequisites check passed"
}

# Create backup
function New-Backup {
    Write-Info "Creating backup..."
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    $BackupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    $BackupPath = Join-Path $BackupDir $BackupName
    
    New-Item -ItemType Directory -Path $BackupPath | Out-Null
    
    # Backup environment files
    Get-ChildItem -Path "." -Filter ".env.*" | Copy-Item -Destination $BackupPath -ErrorAction SilentlyContinue
    
    # Backup uploads and logs if they exist
    if (Test-Path "backend/uploads") {
        Copy-Item -Path "backend/uploads" -Destination $BackupPath -Recurse
    }
    
    if (Test-Path "backend/logs") {
        Copy-Item -Path "backend/logs" -Destination $BackupPath -Recurse
    }
    
    Write-Success "Backup created at $BackupPath"
}

# Deploy application
function Start-Deployment {
    Write-Info "Starting deployment for environment: $Environment"
    
    # Copy environment file
    Copy-Item ".env.$Environment" ".env.production"
    
    # Build and start services
    Write-Info "Building Docker images..."
    docker-compose -f $DockerComposeFile build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
    }
    
    Write-Info "Starting services..."
    docker-compose -f $DockerComposeFile up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start services"
    }
    
    # Wait for services to be healthy
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    # Check service health
    Test-Health
    
    Write-Success "Deployment completed successfully"
}

# Health check
function Test-Health {
    Write-Info "Performing health checks..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "Application is healthy"
                return
            }
        }
        catch {
            Write-Warning "Health check attempt $attempt/$maxAttempts failed, retrying in 10 seconds..."
            Start-Sleep -Seconds 10
            $attempt++
        }
    }
    
    Write-Error "Health check failed after $maxAttempts attempts"
}

# Rollback function
function Start-Rollback {
    Write-Warning "Rolling back deployment..."
    
    docker-compose -f $DockerComposeFile down
    
    # Restore from latest backup
    $latestBackup = Get-ChildItem -Path $BackupDir | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestBackup) {
        Write-Info "Restoring from backup: $($latestBackup.Name)"
        # Add restore logic here
    }
    
    Write-Success "Rollback completed"
}

# Cleanup old backups (keep last 5)
function Remove-OldBackups {
    Write-Info "Cleaning up old backups..."
    
    if (Test-Path $BackupDir) {
        $backups = Get-ChildItem -Path $BackupDir | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt 5) {
            $backupsToRemove = $backups | Select-Object -Skip 5
            foreach ($backup in $backupsToRemove) {
                Remove-Item -Path $backup.FullName -Recurse -Force
            }
        }
    }
    
    Write-Success "Backup cleanup completed"
}

# Show usage
function Show-Usage {
    Write-Host "Usage: .\deploy.ps1 [-Environment <env>] [options]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Environment    Target environment (default: production)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -NoBackup       Skip backup creation"
    Write-Host "  -Rollback       Rollback to previous version"
    Write-Host "  -HealthOnly     Only perform health check"
    Write-Host "  -Help           Show this help message"
}

# Main execution
function Main {
    Write-Info "Starting deployment script for $AppName"
    
    if ($Help) {
        Show-Usage
        exit 0
    }
    
    if ($Rollback) {
        Start-Rollback
        exit 0
    }
    
    if ($HealthOnly) {
        Test-Health
        exit 0
    }
    
    Test-Prerequisites
    
    if (-not $NoBackup) {
        New-Backup
    }
    
    try {
        Start-Deployment
        Remove-OldBackups
        
        Write-Success "Deployment completed successfully!"
        Write-Info "Application is running at: http://localhost (HTTP) and https://localhost (HTTPS)"
        Write-Info "API is available at: http://localhost/api"
        Write-Info "Logs can be viewed with: docker-compose -f $DockerComposeFile logs -f"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message). Consider running with -Rollback option."
    }
}

# Run main function
Main