Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root "assets\generated\props_imagen_hd_candles.png"
$Cell = 256
$Cols = 4
$Rows = 2

function New-Argb($a, $r, $g, $b) {
  [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function Draw-Flame($g, [float]$cx, [float]$cy, [float]$scale, [int]$phase) {
  $outer = New-Object System.Drawing.Drawing2D.GraphicsPath
  $lean = @(-4, 2, -2, 5)[$phase]
  $outer.StartFigure()
  $outer.AddBezier($cx, $cy - 42 * $scale, $cx - 24 * $scale, $cy - 15 * $scale, $cx - 14 * $scale, $cy + 12 * $scale, $cx, $cy + 20 * $scale)
  $outer.AddBezier($cx, $cy + 20 * $scale, $cx + 18 * $scale, $cy + 8 * $scale, $cx + (18 + $lean) * $scale, $cy - 18 * $scale, $cx, $cy - 42 * $scale)
  $outer.CloseFigure()

  $glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($outer)
  $glow.CenterColor = New-Argb 235 255 210 84
  $glow.SurroundColors = @((New-Argb 0 255 114 34))
  $g.FillPath($glow, $outer)
  $glow.Dispose()

  $inner = New-Object System.Drawing.Drawing2D.GraphicsPath
  $inner.StartFigure()
  $inner.AddBezier($cx + 1 * $scale, $cy - 25 * $scale, $cx - 8 * $scale, $cy - 8 * $scale, $cx - 5 * $scale, $cy + 8 * $scale, $cx, $cy + 12 * $scale)
  $inner.AddBezier($cx, $cy + 12 * $scale, $cx + 8 * $scale, $cy + 4 * $scale, $cx + 8 * $scale, $cy - 10 * $scale, $cx + 1 * $scale, $cy - 25 * $scale)
  $inner.CloseFigure()
  $brush = New-Object System.Drawing.SolidBrush (New-Argb 230 255 247 203)
  $g.FillPath($brush, $inner)
  $brush.Dispose()
  $outer.Dispose()
  $inner.Dispose()
}

function Draw-StandingCandle($g, [int]$cellX, [int]$phase) {
  $cx = $cellX + 128
  $ground = 218
  $gold1 = New-Argb 255 113 77 31
  $gold2 = New-Argb 255 236 187 90
  $dark = New-Argb 255 30 19 10

  $baseBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    ([System.Drawing.RectangleF]::new($cx - 54, $ground - 30, 108, 26)),
    $dark,
    $gold2,
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $g.FillEllipse($baseBrush, $cx - 54, $ground - 30, 108, 24)
  $g.FillRectangle($baseBrush, $cx - 44, $ground - 36, 88, 18)
  $baseBrush.Dispose()

  $pen = New-Object System.Drawing.Pen($gold2, 3)
  $g.DrawEllipse($pen, $cx - 54, $ground - 31, 108, 25)
  $g.DrawLine($pen, $cx - 30, $ground - 36, $cx - 16, $ground - 70)
  $g.DrawLine($pen, $cx + 30, $ground - 36, $cx + 16, $ground - 70)
  $g.DrawLine($pen, $cx, $ground - 34, $cx, $ground - 116)
  $pen.Dispose()

  foreach ($offset in @(-18, 0, 18)) {
    $wax = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      ([System.Drawing.RectangleF]::new($cx + $offset - 9, $ground - 120, 18, 68)),
      (New-Argb 255 255 247 215),
      (New-Argb 255 191 154 92),
      [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
    )
    $g.FillRectangle($wax, $cx + $offset - 8, $ground - 118, 16, 66)
    $g.FillEllipse($wax, $cx + $offset - 8, $ground - 124, 16, 12)
    $wax.Dispose()
    $melt = New-Object System.Drawing.SolidBrush (New-Argb 160 255 231 181)
    $g.FillEllipse($melt, $cx + $offset - 7, $ground - 104, 7, 18)
    $melt.Dispose()
    Draw-Flame $g ($cx + $offset) ($ground - 136 + @(-2,1,0,2)[$phase]) 0.62 (($phase + $offset + 18) % 4)
  }

  $orn = New-Object System.Drawing.Pen($gold1, 2)
  $g.DrawArc($orn, $cx - 42, $ground - 84, 84, 62, 206, 128)
  $g.DrawArc($orn, $cx - 26, $ground - 74, 52, 42, 210, 120)
  $orn.Dispose()
}

function Draw-WallSconce($g, [int]$cellX, [int]$phase) {
  $cx = $cellX + 128
  $cy = 136
  $gold = New-Argb 255 224 174 82
  $bronze = New-Argb 255 80 50 24
  $plate = New-Object System.Drawing.Drawing2D.GraphicsPath
  $plate.AddEllipse($cx - 40, $cy - 52, 80, 112)
  $plateBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($plate)
  $plateBrush.CenterColor = New-Argb 210 80 47 23
  $plateBrush.SurroundColors = @((New-Argb 60 9 6 5))
  $g.FillPath($plateBrush, $plate)
  $plateBrush.Dispose()
  $plate.Dispose()

  $pen = New-Object System.Drawing.Pen($gold, 4)
  $g.DrawEllipse($pen, $cx - 40, $cy - 52, 80, 112)
  $g.DrawLine($pen, $cx - 30, $cy + 34, $cx, $cy + 6)
  $g.DrawLine($pen, $cx + 30, $cy + 34, $cx, $cy + 6)
  $g.DrawLine($pen, $cx, $cy + 46, $cx, $cy - 38)
  $pen.Dispose()

  $cup = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    ([System.Drawing.RectangleF]::new($cx - 30, $cy + 22, 60, 22)),
    $bronze,
    $gold,
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $g.FillEllipse($cup, $cx - 30, $cy + 22, 60, 22)
  $g.FillRectangle($cup, $cx - 23, $cy + 28, 46, 16)
  $cup.Dispose()

  $wax = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    ([System.Drawing.RectangleF]::new($cx - 13, $cy - 44, 26, 78)),
    (New-Argb 255 255 248 220),
    (New-Argb 255 199 159 95),
    [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
  )
  $g.FillRectangle($wax, $cx - 12, $cy - 42, 24, 78)
  $g.FillEllipse($wax, $cx - 12, $cy - 50, 24, 14)
  $wax.Dispose()
  Draw-Flame $g $cx ($cy - 66 + @(0,2,-1,1)[$phase]) 0.78 $phase
}

$bmp = New-Object System.Drawing.Bitmap ($Cell * $Cols), ($Cell * $Rows), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

for ($i = 0; $i -lt $Cols; $i += 1) {
  Draw-StandingCandle $g ($i * $Cell) $i
  $g.TranslateTransform(0, $Cell)
  Draw-WallSconce $g ($i * $Cell) (($i + 2) % $Cols)
  $g.ResetTransform()
}

$dir = Split-Path -Parent $Out
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Wrote $Out"
