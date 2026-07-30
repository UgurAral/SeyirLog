Add-Type -AssemblyName System.Drawing

$width = 1024
$height = 500
$bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background gradient (koyu lacivert -> biraz daha açık lacivert)
$colorTop = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)      # #0F172A
$colorBottom = [System.Drawing.Color]::FromArgb(255, 26, 26, 46)   # #1a1a2e
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $colorTop, $colorBottom, 45)
$g.FillRectangle($brush, $rect)

# İkon (sol tarafta, ortalanmış)
$iconPath = "c:\Users\ugura\projects\SeyirLog\assets\icon.png"
$icon = [System.Drawing.Image]::FromFile($iconPath)
$iconSize = 340
$iconX = 70
$iconY = [int](($height - $iconSize) / 2)
# Yuvarlatılmış köşe için clip path
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 64
$d = $radius * 2
$path.AddArc($iconX, $iconY, $d, $d, 180, 90)
$path.AddArc($iconX + $iconSize - $d, $iconY, $d, $d, 270, 90)
$path.AddArc($iconX + $iconSize - $d, $iconY + $iconSize - $d, $d, $d, 0, 90)
$path.AddArc($iconX, $iconY + $iconSize - $d, $d, $d, 90, 90)
$path.CloseFigure()
$g.SetClip($path)
$g.DrawImage($icon, $iconX, $iconY, $iconSize, $iconSize)
$g.ResetClip()

# Başlık
$titleFont = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)
$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
$titleX = $iconX + $iconSize + 50
$g.DrawString("SeyirLog", $titleFont, $titleBrush, $titleX, 150)

# Alt başlık
$subFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$g.DrawString("Surucu icin sefer, yakit ve gider takibi", $subFont, $subBrush, $titleX, 250)

# Mavi vurgu çizgisi
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
$g.FillRectangle($accentBrush, $titleX, 310, 120, 6)

$outPath = "c:\Users\ugura\projects\SeyirLog\store-assets\feature-graphic.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$icon.Dispose()

Write-Output "Saved: $outPath"
