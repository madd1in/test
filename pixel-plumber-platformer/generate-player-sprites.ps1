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

function Fill-Polygon($g, $color, $points) {
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
  $pt = @()
  for ($i = 0; $i -lt $points.Length; $i += 2) {
    $pt += New-Object System.Drawing.Point([int][Math]::Round($points[$i]), [int][Math]::Round($points[$i + 1]))
  }
  $g.FillPolygon($brush, $pt)
  $brush.Dispose()
}

function Draw-Spark($g, $ox, $oy, $x, $y, $c) {
  Fill-Rect $g "#fff8c7" ($ox + $x) ($oy + $y + 1) 5 1
  Fill-Rect $g "#fff8c7" ($ox + $x + 2) ($oy + $y - 1) 1 5
  Fill-Rect $g $c ($ox + $x + 1) ($oy + $y) 3 3
}

function Draw-PlayerFrame($g, $ox, $oy, $pose, $f) {
  $phase = ($f / 24.0) * [Math]::PI * 2
  $bob = [int]([Math]::Sin($phase) * 1.5)
  $lean = 0
  $squash = 0
  $faceY = 0
  $armA = [int]([Math]::Sin($phase + 1.7) * 3)
  $armB = -$armA
  $legA = [int]([Math]::Sin($phase) * 4)
  $legB = -$legA
  $mouth = 0
  $blink = ($pose -eq "idle" -and ($f % 24) -in 18, 19)

  if ($pose -eq "run") {
    $lean = 2
    $bob = [int]([Math]::Abs([Math]::Sin($phase)) * -2)
    $armA = [int]([Math]::Sin($phase + [Math]::PI) * 5)
    $armB = -$armA
  } elseif ($pose -eq "jump") {
    $bob = -3
    $legA = -4
    $legB = -1
    $armA = -5
    $armB = -2
    $mouth = 1
  } elseif ($pose -eq "fall") {
    $bob = 2
    $legA = 2
    $legB = 4
    $armA = -1
    $armB = -5
    $mouth = 1
  } elseif ($pose -eq "dash") {
    $lean = 5
    $bob = -1
    $legA = -2
    $legB = 3
    $armA = -6
    $armB = 5
  } elseif ($pose -eq "skid") {
    $lean = -3
    $legA = 1
    $legB = 1
    $armA = -2
    $armB = 4
    $mouth = 1
  } elseif ($pose -eq "doubleJump") {
    $lean = [int]([Math]::Sin($phase) * 3)
    $bob = -2
    $legA = [int]([Math]::Cos($phase) * 3)
    $legB = -$legA
    $armA = [int]([Math]::Sin($phase + 0.8) * 5)
    $armB = -$armA
  } elseif ($pose -eq "hurt") {
    $lean = -3 + ($f % 3)
    $bob = -2
    $legA = -2
    $legB = 3
    $armA = 4
    $armB = -4
    $mouth = 2
  } elseif ($pose -eq "victory") {
    $bob = [int]([Math]::Sin($phase * 2) * 2)
    $legA = 0
    $legB = [int]([Math]::Sin($phase) * 2)
    $armA = -10
    $armB = [int]([Math]::Sin($phase) * 3)
  } elseif ($pose -eq "crouch") {
    $bob = 4
    $squash = 3
    $legA = 1
    $legB = 1
    $armA = 2
    $armB = 2
  } elseif ($pose -eq "climb") {
    $bob = 0
    $legA = [int]([Math]::Sin($phase) * 3)
    $legB = -$legA
    $armA = [int]([Math]::Sin($phase) * 6) - 5
    $armB = -$armA - 8
  } elseif ($pose -eq "swim") {
    $bob = [int]([Math]::Sin($phase) * 2)
    $lean = 4
    $legA = [int]([Math]::Sin($phase * 1.4) * 3)
    $legB = -$legA
    $armA = [int]([Math]::Cos($phase) * 7)
    $armB = -$armA
  }

  if ($pose -eq "dash") {
    Fill-Rect $g "#9eeaff" ($ox + 0) ($oy + 15) 10 3
    Fill-Rect $g "#ffffff" ($ox + 2) ($oy + 20) 8 1
    Fill-Rect $g "#56bde6" ($ox + 1) ($oy + 24) 6 2
  }
  if ($pose -eq "doubleJump") {
    Fill-Ellipse $g "#7ceaff" ($ox + 3) ($oy + 20) 25 7
    Fill-Rect $g "#ffffff" ($ox + 8 + [Math]::Sin($phase) * 4) ($oy + 19) 5 2
  }
  if ($pose -eq "skid") {
    Draw-Spark $g $ox $oy 2 28 "#ffc84a"
    Fill-Rect $g "#d8f0ff" ($ox + 4) ($oy + 26) 7 2
  }
  if ($pose -eq "hurt") {
    Draw-Spark $g $ox $oy 4 3 "#ff6b6b"
    Draw-Spark $g $ox $oy 23 7 "#ffc84a"
  }

  $bodyY = $oy + 14 + $bob + $squash
  $headY = $oy + 6 + $bob + [int]($squash * 0.35) + $faceY
  $x = $ox + $lean

  Fill-Rect $g "#17110c" ($x + 6) ($oy + 27 + $legA) 8 4
  Fill-Rect $g "#17110c" ($x + 19) ($oy + 27 + $legB) 8 4
  Fill-Rect $g "#2f62d0" ($x + 8) ($bodyY) 17 (12 - [int]($squash * 0.6))
  Fill-Rect $g "#1c3d91" ($x + 9) ($bodyY + 9) 15 7
  Fill-Rect $g "#153071" ($x + 8) ($bodyY + 20) 7 5
  Fill-Rect $g "#153071" ($x + 18) ($bodyY + 20) 7 5
  Fill-Rect $g "#ffd966" ($x + 11) ($bodyY + 3) 3 3
  Fill-Rect $g "#ffd966" ($x + 20) ($bodyY + 3) 3 3
  Fill-Rect $g "#88d7ff" ($x + 10) ($bodyY + 1) 12 2
  Fill-Rect $g "#fff1db" ($x + 3) ($bodyY + 4 + $armA) 6 5
  Fill-Rect $g "#fff1db" ($x + 25) ($bodyY + 4 + $armB) 5 5
  Fill-Rect $g "#ecb77f" ($x + 5) ($bodyY + 1 + $armA) 5 8
  Fill-Rect $g "#ecb77f" ($x + 24) ($bodyY + 1 + $armB) 5 8

  if ($pose -eq "victory") {
    Fill-Rect $g "#d6d7de" ($x + 3) ($oy + 1 + $bob) 3 13
    Fill-Rect $g "#7e8791" ($x + 1) ($oy + 1 + $bob) 7 3
    Draw-Spark $g $ox $oy 2 2 "#8ff6ff"
  }

  Fill-Rect $g "#2b160d" ($x + 7) ($headY + 6) 18 9
  Fill-Rect $g "#f1bd83" ($x + 7) ($headY + 4) 17 12
  Fill-Rect $g "#d49a66" ($x + 8) ($headY + 13) 12 3
  Fill-Rect $g "#26130c" ($x + 20) ($headY + 12) 6 2
  Fill-Rect $g "#f6d0a0" ($x + 17) ($headY + 8) 5 4
  if ($blink) {
    Fill-Rect $g "#1c100b" ($x + 18) ($headY + 9) 4 1
  } else {
    Fill-Rect $g "#fff9df" ($x + 18) ($headY + 8) 4 4
    Fill-Rect $g "#1c100b" ($x + 20) ($headY + 9) 2 2
  }
  if ($mouth -eq 1) {
    Fill-Rect $g "#27130c" ($x + 21) ($headY + 15) 4 2
  } elseif ($mouth -eq 2) {
    Fill-Rect $g "#27130c" ($x + 19) ($headY + 15) 6 3
  } else {
    Fill-Rect $g "#27130c" ($x + 21) ($headY + 14) 5 2
  }
  Fill-Rect $g "#d83b2d" ($x + 6) ($headY) 20 7
  Fill-Rect $g "#b82620" ($x + 4) ($headY + 5) 13 4
  Fill-Rect $g "#ff7861" ($x + 9) ($headY + 1) 13 2
  Fill-Rect $g "#fff5d7" ($x + 14) ($headY + 2) 4 3
}

$fw = 32
$fh = 32
$cols = 24
$rows = 12
$sheet = New-Bmp ($cols * $fw) ($rows * $fh)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

$poses = @("idle", "run", "jump", "fall", "dash", "skid", "doubleJump", "hurt", "victory", "crouch", "climb", "swim")
for ($r = 0; $r -lt $poses.Length; $r++) {
  for ($c = 0; $c -lt $cols; $c++) {
    Draw-PlayerFrame $g ($c * $fw) ($r * $fh) $poses[$r] $c
  }
}

$sheet.Save((Join-Path $assetsDir "plumber_player_sprites.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$sheet.Dispose()
