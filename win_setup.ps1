# Check if Docker is installed, if not, download and install Docker Desktop for Windows
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not installed. Downloading and installing Docker Desktop for Windows..."
    
    # Download the Docker Desktop installer
    $dockerInstallerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:USERPROFILE\Downloads\DockerInstaller.exe"
    
    Start-BitsTransfer -Source $dockerInstallerUrl -Destination $installerPath
    
    # Install Docker Desktop
    Write-Host "Installing Docker Desktop..."
    Start-Process -FilePath $installerPath -Verb RunAs -Wait 
    
	$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
	if (-not $dockerProcess) {
		Write-Host "Starting Docker Desktop..."
		Start-Process -FilePath "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe" -NoNewWindow
		
		# Wait for Docker to start
		Write-Host "Waiting for Docker to start..."
		while ($true) {
			$dockerStatus = docker ps 2>$null
			if ($dockerStatus -ne $null) {
				Write-Host "Docker daemon started successfully."
				break
			}
			Write-Host "Docker daemon not started yet. Retrying in 10 seconds..."
			Start-Sleep -Seconds 10
		}
		Write-Host "Docker installed successfully."
	}

    Write-Host "Docker is installed."
}

Write-Host "Docker is already installed."

# Pull the Docker images from Docker Hub
function PullImages {
    Write-Host "[INFO] Download images from Docker Hub..."
    try {
        docker pull bspsupsi/sleepyland:gui
        docker pull bspsupsi/sleepyland:manager-api
        docker pull bspsupsi/sleepyland:usleepyland
        docker pull bspsupsi/sleepyland:notebook
        docker pull bspsupsi/sleepyland:nsrr-download
        docker pull bspsupsi/sleepyland:wild-to-fancy
        Write-Host "[INFO] Images downloaded successfully."
    } catch {
        Write-Host "[ERROR] Error downloading images from Docker Hub."
        exit 1
    }
}

$forcePull = $true

# Download the Docker images from Docker Hub
if ($forcePull) {
    PullImages
} else {
    Write-Host "[INFO] No update required for the Docker images."
}

# Start the Docker containers
Write-Host "[INFO] Starting the Docker containers..."
try {
    docker compose -f docker-compose.yml -p sleepyland up -d --force-recreate
    if ($?) {
        Write-Host "[INFO] Containers started successfully."
    } else {
        Write-Host "[ERROR] Error in the Docker Compose command. Check the Docker Compose configuration."
        exit 1
    }
} catch {
    Write-Host "[ERROR] Error starting the Docker containers."
    exit 1
}

# Open the web interface in the default browser
Write-Host "[INFO] Opening the web interface..."
try {
    Start-Process "http://localhost:8887"
    Write-Host "[INFO] Web interface opened successfully."
} catch {
    Write-Host "[ERROR] Error opening the web interface."
    exit 1
}
