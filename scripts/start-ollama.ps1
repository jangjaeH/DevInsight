$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ollama = Join-Path $root ".tools\ollama\ollama.exe"
$ollamaHome = Join-Path $root ".tools\ollama-home"
$models = Join-Path $root ".tools\ollama-models"

if (-not (Test-Path $ollama)) {
    throw "Ollama binary was not found at $ollama"
}

New-Item -ItemType Directory -Force -Path $ollamaHome, $models | Out-Null

$env:HOME = $ollamaHome
$env:USERPROFILE = $ollamaHome
$env:OLLAMA_MODELS = $models

& $ollama serve
