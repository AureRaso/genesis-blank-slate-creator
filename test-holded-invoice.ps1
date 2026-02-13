$apiKey = Read-Host "Introduce tu HOLDED_API_KEY"

$headers = @{
    "key" = $apiKey
    "Content-Type" = "application/json"
}

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))

$body = @{
    contactId = "698f524a8d0e046e75021dbd"
    date = $timestamp
    currency = "eur"
    language = "es"
    notes = "Factura de prueba - PadeLock Integration Test"
    items = @(
        @{
            name = "Suscripcion PadeLock - Plan Test"
            desc = "Prueba integracion Holded"
            units = 1
            subtotal = 50.00
            tax = 21
        }
    )
} | ConvertTo-Json -Depth 3

Write-Host "`nEnviando factura de prueba a Holded..."
Write-Host "Payload: $body`n"

try {
    $response = Invoke-RestMethod -Method Post -Uri "https://api.holded.com/api/invoicing/v1/documents/invoice" -Headers $headers -Body $body
    Write-Host "EXITO! Factura creada:" -ForegroundColor Green
    $response | ConvertTo-Json

    # Now mark as paid
    Write-Host "`nMarcando factura como cobrada..."
    $payBody = @{
        date = $timestamp
        amount = 50.00
        desc = "Cobro test - PadeLock"
    } | ConvertTo-Json

    $payResponse = Invoke-RestMethod -Method Post -Uri "https://api.holded.com/api/invoicing/v1/documents/invoice/$($response.id)/pay" -Headers $headers -Body $payBody
    Write-Host "EXITO! Factura marcada como cobrada:" -ForegroundColor Green
    $payResponse | ConvertTo-Json
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd()
    }
}