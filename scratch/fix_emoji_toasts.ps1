
# Fix corrupted emoji in toast messages
# Removes all non-ASCII chars that appear at the START of toast string arguments
$files = Get-ChildItem -Path "." -Recurse -Include "*.tsx","*.ts" |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.gemini|scratch" }

$totalFixed = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Pattern: toast.success/error/warning/info("GARBAGE text") or (`GARBAGE text`)
    # Replace leading non-ASCII garbage at start of the string argument
    $newContent = [regex]::Replace(
        $content,
        '(toast\.(success|error|warning|info)\([`''"])\s*[^\x00-\x7E]+\s*',
        '$1'
    )
    
    if ($newContent -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        $totalFixed++
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host ""
Write-Host "Done! Fixed $totalFixed files."
