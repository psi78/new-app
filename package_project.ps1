# package_project.ps1
$zipName = "5K-DMS_Dist.zip"
$sourceDir = Get-Location
$exclude = @("node_modules", ".git", ".env", "server_debug.log", "*.zip", "uploads", "package_project.ps1", ".DS_Store")

Write-Host "Packaging project to $zipName..." -ForegroundColor Cyan

# Create a temporary directory to stage files
$tempDir = Join-Path $env:TEMP ("5k_dms_build_" + (Get-Random))
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Copy files (excluding unwanted items)
Get-ChildItem -Path $sourceDir -Exclude $exclude | ForEach-Object {
    $dest = Join-Path $tempDir $_.Name
    if ($_.Attributes -band [System.IO.FileAttributes]::Directory) {
        # Check if directory name is in exclude list (Get-ChildItem -Exclude doesn't recursive exclude well)
        if ($exclude -notcontains $_.Name) {
            Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
        }
    }
    else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

# Remove node_modules if it snuck in
if (Test-Path "$tempDir\node_modules") { Remove-Item "$tempDir\node_modules" -Recurse -Force }
# Remove .git if it snuck in
if (Test-Path "$tempDir\.git") { Remove-Item "$tempDir\.git" -Recurse -Force }

# Create Zip
$zipPath = Join-Path $sourceDir $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath

# Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "✅ Done! Send '$zipName' to your friends." -ForegroundColor Green
