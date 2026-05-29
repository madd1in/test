param(
  [string]$OutDir = "$PSScriptRoot\..\assets"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$size = 512
$cell = 128
$bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

function New-Color([int]$a, [int]$r, [int]$g, [int]$b) {
  return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function Draw-CellBase([int]$index, [System.Drawing.Color]$accent) {
  $x = ($index % 4) * $script:cell
  $y = [math]::Floor($index / 4) * $script:cell
  $rect = [System.Drawing.RectangleF]::new($x + 10, $y + 10, $script:cell - 20, $script:cell - 20)
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    (New-Color 235 31 40 39),
    (New-Color 235 9 12 13),
    45
  )
  $script:graphics.FillRectangle($brush, $rect)
  $brush.Dispose()
  $pen = [System.Drawing.Pen]::new((New-Color 160 216 183 108), 3)
  $script:graphics.DrawRectangle($pen, $rect.X, $rect.Y, $rect.Width, $rect.Height)
  $pen.Dispose()
  $glow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(70, $accent))
  $script:graphics.FillEllipse($glow, $x + 30, $y + 30, 68, 68)
  $glow.Dispose()
}

function Draw-Line([int]$index, [int[]]$dirs, [System.Drawing.Color]$color) {
  $x = ($index % 4) * $script:cell
  $y = [math]::Floor($index / 4) * $script:cell
  $cx = $x + $script:cell / 2
  $cy = $y + $script:cell / 2
  $pen = [System.Drawing.Pen]::new($color, 12)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  foreach ($dir in $dirs) {
    $ex = $cx
    $ey = $cy
    if ($dir -eq 0) { $ey -= 42 }
    if ($dir -eq 1) { $ex += 42 }
    if ($dir -eq 2) { $ey += 42 }
    if ($dir -eq 3) { $ex -= 42 }
    $script:graphics.DrawLine($pen, $cx, $cy, $ex, $ey)
  }
  $pen.Dispose()
  $dot = [System.Drawing.SolidBrush]::new($color)
  $script:graphics.FillEllipse($dot, $cx - 11, $cy - 11, 22, 22)
  $dot.Dispose()
}

function Draw-Diamond([int]$index, [System.Drawing.Color]$color) {
  $x = ($index % 4) * $script:cell
  $y = [math]::Floor($index / 4) * $script:cell
  $points = @(
    ([System.Drawing.PointF]::new($x + 64, $y + 22)),
    ([System.Drawing.PointF]::new($x + 104, $y + 64)),
    ([System.Drawing.PointF]::new($x + 64, $y + 106)),
    ([System.Drawing.PointF]::new($x + 24, $y + 64))
  )
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(220, $color))
  $pen = [System.Drawing.Pen]::new((New-Color 210 255 255 255), 4)
  $script:graphics.FillPolygon($brush, $points)
  $script:graphics.DrawPolygon($pen, $points)
  $brush.Dispose()
  $pen.Dispose()
}

$cyan = New-Color 255 102 232 255
$amber = New-Color 255 255 199 90
$violet = New-Color 255 201 147 255
$brass = New-Color 255 255 220 146
$wall = New-Color 255 84 91 92

Draw-CellBase 0 $brass
Draw-CellBase 1 $brass
Draw-Line 1 @(0, 2) $brass
Draw-CellBase 2 $brass
Draw-Line 2 @(0, 1) $brass
Draw-CellBase 3 $cyan
Draw-Line 3 @(1, 2, 3) $cyan

Draw-CellBase 4 $wall
$wallBrush = [System.Drawing.SolidBrush]::new((New-Color 190 18 21 22))
$graphics.FillRectangle($wallBrush, 4, 128, 120, 120)
$wallBrush.Dispose()
Draw-Diamond 5 $cyan
Draw-Diamond 6 $amber
Draw-Diamond 7 $violet

Draw-CellBase 8 $cyan
Draw-Line 8 @(1) $cyan
Draw-CellBase 9 $amber
Draw-Line 9 @(2) $amber
Draw-CellBase 10 $violet
Draw-Line 10 @(0, 1, 2, 3) $violet
Draw-Diamond 11 (New-Color 255 141 255 177)

Draw-CellBase 12 $cyan
Draw-CellBase 13 $amber
Draw-CellBase 14 $violet
Draw-CellBase 15 $brass

$glyphPath = Join-Path $OutDir "lumen-lock-glyphs.png"
$bitmap.Save($glyphPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

$icon = [System.Drawing.Bitmap]::new(256, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($icon)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear((New-Color 0 0 0 0))
$iconBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  ([System.Drawing.RectangleF]::new(0, 0, 256, 256)),
  $cyan,
  $amber,
  35
)
$g.FillEllipse($iconBrush, 20, 20, 216, 216)
$iconBrush.Dispose()
$dark = [System.Drawing.SolidBrush]::new((New-Color 215 5 10 12))
$g.FillEllipse($dark, 52, 52, 152, 152)
$dark.Dispose()
$penIcon = [System.Drawing.Pen]::new($violet, 14)
$penIcon.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penIcon.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($penIcon, 76, 128, 128, 76)
$g.DrawLine($penIcon, 128, 76, 180, 128)
$g.DrawLine($penIcon, 76, 128, 180, 128)
$penIcon.Dispose()
$iconPath = Join-Path $OutDir "lumen-lock-icon.png"
$icon.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$icon.Dispose()

Write-Host "Wrote $glyphPath"
Write-Host "Wrote $iconPath"
