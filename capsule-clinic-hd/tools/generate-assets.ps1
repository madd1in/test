$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")
$outDir = Join-Path $root "assets\hd"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Color-Hex([string] $hex, [int] $alpha = 255) {
  $clean = $hex.TrimStart("#")
  $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b)
}

function New-Canvas([int] $w, [int] $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @{ Bitmap = $bmp; Graphics = $g }
}

function New-RoundedPath([float] $x, [float] $y, [float] $w, [float] $h, [float] $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-Png($bmp, [string] $path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Draw-Glint($g, [float] $x, [float] $y, [float] $w, [float] $h) {
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF($x, $y, $w, $h)),
    [System.Drawing.Color]::FromArgb(130, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
    35
  )
  $path = New-RoundedPath ($x) ($y) ($w) ($h) ($h / 2)
  $g.FillPath($brush, $path)
  $path.Dispose()
  $brush.Dispose()
}

$palette = @(
  @{ Main = "#f85f77"; Dark = "#8e203b"; Light = "#ffc0cb" },
  @{ Main = "#48dacd"; Dark = "#126f7a"; Light = "#b9fff6" },
  @{ Main = "#ffd166"; Dark = "#9f6518"; Light = "#fff2a8" },
  @{ Main = "#a98cff"; Dark = "#4d3a92"; Light = "#ddd1ff" }
)

# Background
$canvasObj = New-Canvas 1920 1080
$bmp = $canvasObj.Bitmap
$g = $canvasObj.Graphics
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, 0, 1920, 1080)),
  (Color-Hex "#10223d"),
  (Color-Hex "#07101e"),
  90
)
$g.FillRectangle($bg, 0, 0, 1920, 1080)
$bg.Dispose()

$rng = New-Object System.Random(22)
for ($i = 0; $i -lt 44; $i++) {
  $x = $rng.Next(-220, 1860)
  $y = $rng.Next(40, 1010)
  $w = $rng.Next(120, 420)
  $h = $rng.Next(90, 260)
  $color = if ($i % 3 -eq 0) { [System.Drawing.Color]::FromArgb(24, 83, 225, 209) } elseif ($i % 3 -eq 1) { [System.Drawing.Color]::FromArgb(18, 255, 209, 102) } else { [System.Drawing.Color]::FromArgb(18, 248, 95, 119) }
  $brush = New-Object System.Drawing.SolidBrush($color)
  $g.FillEllipse($brush, $x, $y, $w, $h)
  $brush.Dispose()
}

$shelfPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(62, 190, 226, 255), 4)
for ($row = 0; $row -lt 4; $row++) {
  $sy = 190 + $row * 212
  $g.DrawLine($shelfPen, 92, $sy, 1828, $sy)
  for ($i = 0; $i -lt 15; $i++) {
    $x = 120 + $i * 120 + (($row % 2) * 34)
    $vial = New-RoundedPath $x ($sy - 92) 44 92 16
    $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF($x, ($sy - 92), 44, 92)),
      [System.Drawing.Color]::FromArgb(80, 72, 218, 205),
      [System.Drawing.Color]::FromArgb(20, 255, 209, 102),
      90
    )
    $g.FillPath($fill, $vial)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(55, 238, 248, 255), 2)), $vial)
    $vial.Dispose()
    $fill.Dispose()
  }
}
$shelfPen.Dispose()

$vignette = New-Object System.Drawing.Drawing2D.GraphicsPath
$vignette.AddEllipse(-260, -200, 2440, 1480)
$shade = New-Object System.Drawing.Drawing2D.PathGradientBrush($vignette)
$shade.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$shade.SurroundColors = @([System.Drawing.Color]::FromArgb(176, 0, 0, 0))
$g.FillRectangle($shade, 0, 0, 1920, 1080)
$shade.Dispose()
$vignette.Dispose()
Save-Png $bmp (Join-Path $outDir "background-lab-hd.png")
$g.Dispose()
$bmp.Dispose()

# Capsule atlas
$canvasObj = New-Canvas 1024 256
$bmp = $canvasObj.Bitmap
$g = $canvasObj.Graphics
$g.Clear([System.Drawing.Color]::Transparent)
for ($i = 0; $i -lt 4; $i++) {
  $x = $i * 256
  $path = New-RoundedPath ($x + 34) 48 188 160 64
  $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF(($x + 34), 48, 188, 160)),
    (Color-Hex $palette[$i].Light),
    (Color-Hex $palette[$i].Dark),
    38
  )
  $g.FillPath($fill, $path)
  $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), 5)), $path)
  $g.DrawPath((New-Object System.Drawing.Pen((Color-Hex $palette[$i].Dark 190), 8)), $path)
  Draw-Glint $g ($x + 66) 70 92 32
  $stripe = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(85, 255, 255, 255), 8)
  $g.DrawArc($stripe, $x + 62, 78, 122, 82, 205, 88)
  $stripe.Dispose()
  $path.Dispose()
  $fill.Dispose()
}
Save-Png $bmp (Join-Path $outDir "capsule-atlas-hd.png")
$g.Dispose()
$bmp.Dispose()

# Virus atlas
$canvasObj = New-Canvas 1024 256
$bmp = $canvasObj.Bitmap
$g = $canvasObj.Graphics
$g.Clear([System.Drawing.Color]::Transparent)
for ($i = 0; $i -lt 4; $i++) {
  $baseX = $i * 256
  $cx = $baseX + 128
  $cy = 130
  for ($s = 0; $s -lt 12; $s++) {
    $angle = ($s / 12.0) * [Math]::PI * 2
    $sx = $cx + [Math]::Cos($angle) * 76
    $sy = $cy + [Math]::Sin($angle) * 62
    $spikeBrush = New-Object System.Drawing.SolidBrush((Color-Hex $palette[$i].Dark 235))
    $g.FillEllipse($spikeBrush, [float]($sx - 16), [float]($sy - 16), 32, 32)
    $spikeBrush.Dispose()
  }
  $bodyPath = New-RoundedPath ($baseX + 44) 48 168 164 58
  $bodyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF(($baseX + 44), 48, 168, 164)),
    (Color-Hex $palette[$i].Light),
    (Color-Hex $palette[$i].Dark),
    55
  )
  $g.FillPath($bodyBrush, $bodyPath)
  $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(185, 255, 255, 255), 4)), $bodyPath)
  $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 5, 16, 26))
  $shineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
  $g.FillEllipse($eyeBrush, $baseX + 86, 101, 30, 40)
  $g.FillEllipse($eyeBrush, $baseX + 142, 101, 30, 40)
  $g.FillEllipse($shineBrush, $baseX + 96, 110, 8, 10)
  $g.FillEllipse($shineBrush, $baseX + 152, 110, 8, 10)
  $mouthPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 5, 16, 26), 7)
  $g.DrawArc($mouthPen, $baseX + 96, 144, 64, 34, 10, 160)
  $eyeBrush.Dispose()
  $shineBrush.Dispose()
  $mouthPen.Dispose()
  $bodyBrush.Dispose()
  $bodyPath.Dispose()
}
Save-Png $bmp (Join-Path $outDir "virus-atlas-hd.png")
$g.Dispose()
$bmp.Dispose()

# Bottle frame
$canvasObj = New-Canvas 1200 1700
$bmp = $canvasObj.Bitmap
$g = $canvasObj.Graphics
$g.Clear([System.Drawing.Color]::Transparent)
$outer = New-RoundedPath 148 168 904 1396 92
$glass = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.RectangleF(148, 168, 904, 1396)),
  [System.Drawing.Color]::FromArgb(98, 163, 239, 255),
  [System.Drawing.Color]::FromArgb(22, 83, 225, 209),
  90
)
$g.FillPath($glass, $outer)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(185, 230, 252, 255), 14)), $outer)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(72, 30, 65, 95), 34)), $outer)
$neck = New-RoundedPath 420 34 360 176 62
$g.FillPath($glass, $neck)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(185, 230, 252, 255), 12)), $neck)
$highlight = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(128, 255, 255, 255), 10)
$g.DrawLine($highlight, 268, 258, 268, 1340)
$g.DrawLine($highlight, 350, 112, 708, 112)
$highlight.Dispose()
$glass.Dispose()
$outer.Dispose()
$neck.Dispose()
Save-Png $bmp (Join-Path $outDir "bottle-frame-hd.png")
$g.Dispose()
$bmp.Dispose()

# FX atlas
$canvasObj = New-Canvas 1024 256
$bmp = $canvasObj.Bitmap
$g = $canvasObj.Graphics
$g.Clear([System.Drawing.Color]::Transparent)
for ($i = 0; $i -lt 4; $i++) {
  $cx = $i * 256 + 128
  $cy = 128
  for ($r = 92; $r -gt 12; $r -= 20) {
    $alpha = 28 + $r
    $pen = New-Object System.Drawing.Pen((Color-Hex $palette[$i].Light $alpha), 8)
    $g.DrawEllipse($pen, $cx - $r, $cy - $r, $r * 2, $r * 2)
    $pen.Dispose()
  }
  for ($s = 0; $s -lt 10; $s++) {
    $angle = ($s / 10.0) * [Math]::PI * 2
    $pen = New-Object System.Drawing.Pen((Color-Hex $palette[$i].Main 180), 7)
    $g.DrawLine($pen, [float]($cx + [Math]::Cos($angle) * 26), [float]($cy + [Math]::Sin($angle) * 26), [float]($cx + [Math]::Cos($angle) * 96), [float]($cy + [Math]::Sin($angle) * 96))
    $pen.Dispose()
  }
}
Save-Png $bmp (Join-Path $outDir "fx-atlas-hd.png")
$g.Dispose()
$bmp.Dispose()

$manifest = [ordered]@{
  generated = (Get-Date).ToString("s")
  assets = @(
    "background-lab-hd.png",
    "capsule-atlas-hd.png",
    "virus-atlas-hd.png",
    "bottle-frame-hd.png",
    "fx-atlas-hd.png"
  )
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding ASCII -Path (Join-Path $outDir "asset-manifest.json")
Write-Host "Generated Capsule Clinic HD assets in $outDir"
