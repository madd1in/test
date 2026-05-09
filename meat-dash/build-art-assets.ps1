Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "assets"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

function New-Bmp($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bmp.SetResolution(96, 96)
  return $bmp
}

function Fill-Rect($g, $color, $x, $y, $w, $h) {
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
  $g.FillRectangle($brush, [int][Math]::Round($x), [int][Math]::Round($y), [int][Math]::Round($w), [int][Math]::Round($h))
  $brush.Dispose()
}

function Fill-Ellipse($g, $color, $x, $y, $w, $h) {
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
  $g.FillEllipse($brush, [int][Math]::Round($x), [int][Math]::Round($y), [int][Math]::Round($w), [int][Math]::Round($h))
  $brush.Dispose()
}

function Fill-Poly($g, $color, $points) {
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
  $pt = @()
  for ($i = 0; $i -lt $points.Length; $i += 2) {
    $pt += New-Object System.Drawing.Point([int][Math]::Round($points[$i]), [int][Math]::Round($points[$i + 1]))
  }
  $g.FillPolygon($brush, $pt)
  $brush.Dispose()
}

function Draw-RunnerFrame($g, $ox, $oy, $pose, $frame) {
  $phase = ($frame / 8.0) * [Math]::PI * 2
  $bob = [Math]::Sin($phase) * 1.2
  $lean = 0
  $squash = 0
  $armA = [Math]::Sin($phase + 1.4) * 3
  $armB = -$armA
  $footA = [Math]::Sin($phase) * 3
  $footB = -$footA
  $mouth = 0

  if ($pose -eq "run") {
    $bob = -[Math]::Abs([Math]::Sin($phase)) * 2.5
    $lean = 3
    $armA = [Math]::Sin($phase + [Math]::PI) * 5
    $armB = -$armA
  } elseif ($pose -eq "jump") {
    $bob = -3; $lean = 1; $armA = -5; $armB = -3; $footA = -3; $footB = -1; $mouth = 1
  } elseif ($pose -eq "fall") {
    $bob = 2; $armA = -1; $armB = -5; $footA = 2; $footB = 4; $mouth = 1
  } elseif ($pose -eq "wall") {
    $lean = -3; $bob = [Math]::Sin($phase) * 0.6; $armA = -4; $armB = 4; $footA = -1; $footB = 3
  } elseif ($pose -eq "splat") {
    $squash = 7 - $frame; $bob = 3; $armA = 5; $armB = -5; $mouth = 2
  }

  if ($pose -eq "run") {
    Fill-Rect $g "#ffffff" ($ox + 0) ($oy + 19 + ($frame % 2)) 8 2
    Fill-Rect $g "#ff7580" ($ox + 2) ($oy + 24) 9 2
  }

  $x = $ox + 6 + $lean
  $y = $oy + 6 + $bob + $squash * 0.3
  $bodyW = 21 + $squash * 0.4
  $bodyH = 22 - $squash * 0.45

  Fill-Rect $g "#4b0710" ($x + 2) ($oy + 27 + $footA) 8 4
  Fill-Rect $g "#4b0710" ($x + 14) ($oy + 27 + $footB) 8 4
  Fill-Rect $g "#ffb8bf" ($x - 3) ($y + 12 + $armA) 5 7
  Fill-Rect $g "#ffb8bf" ($x + $bodyW - 1) ($y + 12 + $armB) 5 7
  Fill-Rect $g "#7b101a" ($x - 1) ($y + 1) ($bodyW + 2) ($bodyH + 1)
  Fill-Rect $g "#ff4b57" $x $y $bodyW $bodyH
  Fill-Rect $g "#ff8790" ($x + 3) ($y + 2) ($bodyW - 8) 4
  Fill-Rect $g "#c92936" ($x + 2) ($y + $bodyH - 5) ($bodyW - 4) 4
  Fill-Rect $g "#ffffff" ($x + 5) ($y + 8) 5 5
  Fill-Rect $g "#ffffff" ($x + $bodyW - 10) ($y + 8) 5 5
  Fill-Rect $g "#170407" ($x + 7) ($y + 10) 2 2
  Fill-Rect $g "#170407" ($x + $bodyW - 8) ($y + 10) 2 2
  Fill-Rect $g "#ffd6da" ($x + 3) ($y + 3) 3 9

  if ($mouth -eq 2) {
    Fill-Rect $g "#230408" ($x + 8) ($y + 16) 10 4
    Fill-Rect $g "#fff2ea" ($x + 10) ($y + 16) 2 3
    Fill-Rect $g "#fff2ea" ($x + 15) ($y + 16) 2 3
  } elseif ($mouth -eq 1) {
    Fill-Rect $g "#230408" ($x + 10) ($y + 16) 7 4
  } else {
    Fill-Rect $g "#230408" ($x + 10) ($y + 16) 8 2
  }
}

function Draw-TileFrame($g, $ox, $oy, $kind, $variant) {
  $flicker = $variant % 4
  if ($kind -eq "top") {
    Fill-Rect $g "#1b1017" $ox $oy 32 32
    Fill-Rect $g "#51303a" ($ox + 1) ($oy + 7) 30 24
    Fill-Rect $g "#8b5b68" ($ox + 2) ($oy + 2) 28 8
    Fill-Rect $g "#ffc0cd" ($ox + 4 + $flicker) ($oy + 3) 8 2
    Fill-Rect $g "#2b1820" ($ox + 5) ($oy + 17) 21 3
    Fill-Rect $g "#b37b88" ($ox + 8) ($oy + 12) (6 + $flicker) 2
  } elseif ($kind -eq "side") {
    Fill-Rect $g "#170e14" $ox $oy 32 32
    Fill-Rect $g "#36242e" ($ox + 1) $oy 30 32
    Fill-Rect $g "#5a3b47" ($ox + 3) ($oy + 3) 26 5
    Fill-Rect $g "#21141b" ($ox + 4) ($oy + 14) 24 2
    Fill-Rect $g "#74505c" ($ox + 7) ($oy + 23) 10 2
  } elseif ($kind -eq "metal") {
    Fill-Rect $g "#101721" $ox $oy 32 32
    Fill-Rect $g "#465869" ($ox + 1) ($oy + 1) 30 30
    Fill-Rect $g "#8da2b5" ($ox + 4) ($oy + 4) 22 3
    Fill-Rect $g "#24313e" ($ox + 4) ($oy + 24) 24 3
    Fill-Rect $g "#202c38" ($ox + 14) ($oy + 2) 3 28
    Fill-Rect $g "#ff5b6a" ($ox + 6) ($oy + 8) 4 4
    Fill-Rect $g "#ff5b6a" ($ox + 22) ($oy + 20) 4 4
  } elseif ($kind -eq "boost") {
    Fill-Rect $g "#1a1520" $ox $oy 32 32
    Fill-Rect $g "#ff4b57" ($ox + 1) ($oy + 12) 30 9
    Fill-Rect $g "#fff3f5" ($ox + 5) ($oy + 13) 20 2
    Fill-Poly $g "#69121b" @(($ox + 10), ($oy + 17), ($ox + 18), ($oy + 12), ($ox + 18), ($oy + 22))
    Fill-Rect $g "#61e8ff" ($ox + 6) ($oy + 24) 20 3
  }
}

$runner = New-Bmp 256 192
$g = [System.Drawing.Graphics]::FromImage($runner)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$poses = @("idle", "run", "jump", "fall", "wall", "splat")
for ($r = 0; $r -lt $poses.Length; $r++) {
  for ($c = 0; $c -lt 8; $c++) {
    Draw-RunnerFrame $g ($c * 32) ($r * 32) $poses[$r] $c
  }
}
$runner.Save((Join-Path $assetsDir "runner-sprites.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$runner.Dispose()

$tiles = New-Bmp 256 128
$g = [System.Drawing.Graphics]::FromImage($tiles)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$tileKinds = @("top", "side", "metal", "boost")
for ($r = 0; $r -lt $tileKinds.Length; $r++) {
  for ($c = 0; $c -lt 8; $c++) {
    Draw-TileFrame $g ($c * 32) ($r * 32) $tileKinds[$r] $c
  }
}
$tiles.Save((Join-Path $assetsDir "level-tiles.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$tiles.Dispose()

$preview = New-Bmp 960 540
$g = [System.Drawing.Graphics]::FromImage($preview)
$g.Clear([System.Drawing.ColorTranslator]::FromHtml("#16080e"))
for ($y = 0; $y -lt 540; $y += 32) {
  for ($x = 0; $x -lt 960; $x += 32) {
    if ($y -gt 430 -or (($x -gt 420 -and $x -lt 620 -and $y -gt 330) -or ($x -gt 720 -and $y -gt 260 -and $y -lt 300))) {
      Draw-TileFrame $g $x $y "top" (($x + $y) / 32)
    }
  }
}
for ($i = 0; $i -lt 8; $i++) {
  $sx = 180 + $i * 18
  Fill-Poly $g "#f6e8f0" @($sx, 430, ($sx + 9), 398, ($sx + 18), 430)
}
Fill-Ellipse $g "#cbd3dc" 690 330 56 56
Fill-Ellipse $g "#45505d" 707 347 22 22
Draw-RunnerFrame $g 80 390 "run" 2
$preview.Save((Join-Path $assetsDir "tilemap-preview.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$preview.Dispose()
