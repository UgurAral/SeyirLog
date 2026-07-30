Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\ugura\projects\SeyirLog\assets\icon.png"
$outPath = "c:\Users\ugura\projects\SeyirLog\store-assets\icon-512.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$size = 512
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, 0, 0, $size, $size)

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$src.Dispose()

Write-Output "Saved: $outPath"
