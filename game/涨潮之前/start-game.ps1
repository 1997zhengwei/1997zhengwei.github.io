$ErrorActionPreference = 'Stop'
$gameDirectory = $PSScriptRoot
$gameAddress = 'http://127.0.0.1:8774/'
$previewReady = $false
try {
    $gameResponse = Invoke-WebRequest -UseBasicParsing -Uri $gameAddress -TimeoutSec 2
    $previewReady = $gameResponse.Content -match 'Tidehaven'
    if (-not $previewReady) { throw 'Port 8774 is already used by another app.' }
} catch [System.Net.WebException] {
    $pythonExecutable = (Get-Command python -ErrorAction Stop).Source
    Start-Process -FilePath $pythonExecutable -ArgumentList @('serve.py', '--port', '8774') -WorkingDirectory $gameDirectory -WindowStyle Hidden
}
if (-not $previewReady) {
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        try {
            $gameResponse = Invoke-WebRequest -UseBasicParsing -Uri $gameAddress -TimeoutSec 1
            if ($gameResponse.Content -match 'Tidehaven') { $previewReady = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 100
    }
}
if (-not $previewReady) { throw 'Preview failed to start. Run: python serve.py' }
Start-Process $gameAddress
