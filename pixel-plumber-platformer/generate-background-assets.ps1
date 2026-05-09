Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "assets"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

function New-TransparentBitmap($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bmp.SetResolution(96, 96)
  return $bmp
}

function New-Brush($a, $r, $g, $b) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function Fill-RectA($g, $a, $r, $gg, $b, $x, $y, $w, $h) {
  $brush = New-Brush $a $r $gg $b
  $g.FillRectangle($brush, [int]$x, [int]$y, [int]$w, [int]$h)
  $brush.Dispose()
}

function Fill-EllipseA($g, $a, $r, $gg, $b, $x, $y, $w, $h) {
  $brush = New-Brush $a $r $gg $b
  $g.FillEllipse($brush, [int]$x, [int]$y, [int]$w, [int]$h)
  $brush.Dispose()
}

function Fill-PolyA($g, $a, $r, $gg, $b, $points) {
  $brush = New-Brush $a $r $gg $b
  $pt = @()
  for ($i = 0; $i -lt $points.Length; $i += 2) {
    $pt += New-Object System.Drawing.Point([int]$points[$i], [int]$points[$i + 1])
  }
  $g.FillPolygon($brush, $pt)
  $brush.Dispose()
}

$sil = New-TransparentBitmap 1024 256
$g = [System.Drawing.Graphics]::FromImage($sil)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
for ($i = 0; $i -lt 11; $i++) {
  $x = -90 + $i * 112
  $peak = 48 + (($i * 37) % 72)
  $w = 190 + (($i * 29) % 58)
  Fill-PolyA $g 78 33 82 91 @($x, 256, ($x + $w * 0.5), $peak, ($x + $w), 256)
  Fill-PolyA $g 42 236 252 255 @(($x + $w * 0.5), $peak + 8, ($x + $w * 0.66), 256, ($x + $w * 0.32), 256)
}
for ($i = 0; $i -lt 19; $i++) {
  $x = -45 + $i * 62
  $h = 26 + (($i * 17) % 42)
  Fill-EllipseA $g 58 28 96 70 $x (220 - $h) 110 ($h * 2)
}
$sil.Save((Join-Path $assetsDir "bg_distant_silhouettes.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$sil.Dispose()

$cloud = New-TransparentBitmap 1024 220
$g = [System.Drawing.Graphics]::FromImage($cloud)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
for ($i = 0; $i -lt 18; $i++) {
  $x = -90 + $i * 68
  $y = 40 + (($i * 23) % 72)
  $s = 28 + (($i * 19) % 24)
  Fill-EllipseA $g 34 245 253 255 $x $y ($s * 2) $s
  Fill-EllipseA $g 46 236 249 255 ($x + $s * 0.6) ($y - $s * 0.28) ($s * 2.3) ($s * 1.15)
  Fill-EllipseA $g 30 214 235 244 ($x + $s * 1.8) ($y + $s * 0.1) ($s * 1.9) ($s * 0.95)
}
Fill-RectA $g 18 231 247 255 0 126 1024 52
$cloud.Save((Join-Path $assetsDir "bg_cloud_bank.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$cloud.Dispose()

$mist = New-TransparentBitmap 1024 540
$g = [System.Drawing.Graphics]::FromImage($mist)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
for ($i = 0; $i -lt 12; $i++) {
  $x = -180 + $i * 112
  $y = 74 + (($i * 41) % 360)
  $h = 18 + (($i * 13) % 16)
  Fill-EllipseA $g 30 236 252 255 $x $y 360 $h
  Fill-EllipseA $g 24 202 226 234 ($x + 210) ($y + 18) 280 ($h + 8)
}
for ($i = 0; $i -lt 5; $i++) {
  Fill-RectA $g (16 + $i * 4) 232 249 255 0 (112 + $i * 76) 1024 14
}
$mist.Save((Join-Path $assetsDir "bg_mist_bands.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$mist.Dispose()
