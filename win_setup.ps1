# Ensure Docker and Docker Compose are installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue))
{
    Write-Host "Docker is required. Please install it and try again."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue))
{
    Write-Host "[ERROR] Docker is required. Please install it and try again."
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue))
{
    Write-Host "Docker Compose is required. Please install it and try again."
    exit 1
}
else
{
    Write-Host "[INFO] Docker is installed."
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue))
{
    Write-Host "[ERROR] Docker Compose is required. Please install it and try again."
    exit 1
}
else
{
    Write-Host "[INFO] Docker Compose is installed."
}

# Function to pull images from Docker Hub
function PullImages
{
    Write-Host "[INFO] Pulling pre-built images from Docker Hub..."
    try
    {
        docker pull bspsupsi/sleepyland:gui
        docker pull bspsupsi/sleepyland:manager-api
        docker pull bspsupsi/sleepyland:usleepyland
        docker pull bspsupsi/sleepyland:notebook
        docker pull bspsupsi/sleepyland:nsrr-download
        docker pull bspsupsi/sleepyland:wild-to-fancy
        Write-Host "[INFO] Docker images pulled successfully."
    }
    catch
    {
        Write-Host "[ERROR] Failed to pull Docker images. Please check your internet connection or Docker Hub access."
        exit 1
    }
}

$forcePull = $true

# Pull Docker images if there were changes in the repository
if ($forcePull)
{
    PullImages
}
else
{
    Write-Host "[INFO] No Docker images pull required."
}

# Start Docker containers with --force-recreate
Write-Host "[INFO] Starting Docker containers with forced recreation..."
try
{
    docker compose -f docker-compose.yml -p sleepyland up -d --force-recreate
    if ($?)
    {
        Write-Host "[INFO] Docker containers started successfully."
    }
    else
    {
        Write-Host "[ERROR] Failed to start Docker containers."
        exit 1
    }
}
catch
{
    Write-Host "[ERROR] Docker Compose failed to start the containers. Please check the Docker Compose configuration."
    exit 1
}

# Open the web interface in the default browser
Write-Host "[INFO] Opening the web interface in the default browser..."
try
{
    Start-Process "http://localhost:8887"
    Write-Host "[INFO] Web interface opened successfully."
}
catch
{
    Write-Host "[ERROR] Failed to open the web interface. Please check your default browser settings."
    exit 1
}
