param(
    [switch]$Install
)

$GaworPath = 'C:\Users\karol\OneDrive\Pulpit\Kp\It\Project\Priv\Gawor'
$GaworScriptPath = $PSCommandPath
$ProfileDirectory = Split-Path -Parent $PROFILE
$ProfileLine = ". `"$GaworScriptPath`""
$ProfileFunction = @"
function gawor {
    Set-Location -LiteralPath '$GaworPath'
}
"@

function gawor {
    Set-Location -LiteralPath $GaworPath
}

if ($Install) {
    if (-not (Test-Path -LiteralPath $ProfileDirectory)) {
        New-Item -ItemType Directory -Path $ProfileDirectory -Force | Out-Null
    }

    $ProfileContent = if (Test-Path -LiteralPath $PROFILE) {
        Get-Content -LiteralPath $PROFILE -Raw
    } else {
        ''
    }

    if ($ProfileContent -like "*$ProfileLine*") {
        $ProfileContent = $ProfileContent.Replace($ProfileLine, $ProfileFunction.Trim())
        Set-Content -LiteralPath $PROFILE -Value $ProfileContent
    } elseif ($ProfileContent -notlike '*function gawor*') {
        Add-Content -LiteralPath $PROFILE -Value "`r`n$ProfileFunction"
    }

    . $PROFILE
    Write-Host "Gotowe. Polecenie 'gawor' jest teraz dostępne w PowerShellu."
    return
}

# Uruchomienie pliku bez -Install przenosi bieżące wykonanie do katalogu projektu.
# Aby zmiana katalogu pozostała w tym samym terminalu, użyj funkcji 'gawor'
# zainstalowanej w profilu albo dot-sourcuj plik: . .\gawor.ps1
gawor
