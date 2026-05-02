Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$assetDir = Join-Path $root "assets"
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

$cell = 64
$cols = 8
$rows = 4
$sheet = New-Object System.Drawing.Bitmap ($cols * $cell), ($rows * $cell), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$atlas = [ordered]@{
  meta = [ordered]@{
    image = "sprite-map.png"
    cell = $cell
    note = "Generated local original sprite map for Feather Fling."
  }
  frames = [ordered]@{}
}

function ColorFromHex([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Brush([string]$hex) {
  return New-Object System.Drawing.SolidBrush (ColorFromHex $hex)
}

function Pen([string]$hex, [float]$width = 1) {
  return New-Object System.Drawing.Pen (ColorFromHex $hex), $width
}

function Frame([string]$name, [int]$col, [int]$row) {
  $atlas.frames[$name] = [ordered]@{
    x = $col * $cell
    y = $row * $cell
    w = $cell
    h = $cell
  }
}

function RoundedRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function CellOrigin([int]$col, [int]$row) {
  return @(($col * $script:cell), ($row * $script:cell))
}

function Draw-Bird([int]$col, [int]$row, [string]$name, [string]$body, [string]$wing, [string]$beak) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $g.FillEllipse((Brush "#00000022"), $x + 15, $y + 47, 36, 8)
  $g.FillEllipse((Brush $body), $x + 10, $y + 10, 44, 42)
  $g.FillEllipse((Brush "#ffffff55"), $x + 17, $y + 15, 18, 14)
  $g.FillEllipse((Brush $wing), $x + 11, $y + 25, 18, 19)
  $g.FillEllipse((Brush "#ffffff"), $x + 31, $y + 20, 8, 10)
  $g.FillEllipse((Brush "#ffffff"), $x + 42, $y + 20, 8, 10)
  $g.FillEllipse((Brush "#18212a"), $x + 34, $y + 24, 3, 4)
  $g.FillEllipse((Brush "#18212a"), $x + 45, $y + 24, 3, 4)
  $beakPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $beakPath.AddPolygon(@(
    [System.Drawing.PointF]::new($x + 48, $y + 30),
    [System.Drawing.PointF]::new($x + 61, $y + 35),
    [System.Drawing.PointF]::new($x + 48, $y + 40)
  ))
  $g.FillPath((Brush $beak), $beakPath)
  $g.DrawPath((Pen "#724910" 1.2), $beakPath)
  $g.DrawArc((Pen "#17212a" 2), $x + 27, $y + 18, 14, 9, 190, 70)
  $g.DrawArc((Pen "#17212a" 2), $x + 40, $y + 18, 14, 9, 210, 70)
  $g.DrawEllipse((Pen "#00000044" 1.4), $x + 10, $y + 10, 44, 42)
  Frame $name $col $row
}

function Draw-Target([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $g.FillEllipse((Brush "#00000022"), $x + 16, $y + 49, 34, 7)
  $g.FillEllipse((Brush "#75c85f"), $x + 13, $y + 12, 40, 39)
  $g.FillEllipse((Brush "#a6e189"), $x + 19, $y + 16, 16, 13)
  $g.FillEllipse((Brush "#2b742e"), $x + 22, $y + 25, 7, 7)
  $g.FillEllipse((Brush "#2b742e"), $x + 39, $y + 25, 7, 7)
  $g.FillEllipse((Brush "#eaf6c9"), $x + 24, $y + 26, 2, 2)
  $g.FillEllipse((Brush "#eaf6c9"), $x + 41, $y + 26, 2, 2)
  $nose = RoundedRect ($x + 30) ($y + 31) 12 9 4
  $g.FillPath((Brush "#4d993e"), $nose)
  $g.DrawPath((Pen "#2e672c" 1), $nose)
  $g.DrawArc((Pen "#245322" 2), $x + 28, $y + 37, 17, 8, 10, 160)
  $g.DrawEllipse((Pen "#286a2c" 1.4), $x + 13, $y + 12, 40, 39)
  Frame "target" $col $row
}

function Draw-Block([int]$col, [int]$row, [string]$name, [string]$fill, [string]$edge, [string]$line) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $p = RoundedRect ($x + 8) ($y + 16) 48 32 5
  $g.FillPath((Brush $fill), $p)
  $g.DrawPath((Pen $edge 2), $p)
  $g.DrawLine((Pen $line 2), $x + 14, $y + 25, $x + 50, $y + 25)
  $g.DrawLine((Pen $line 2), $x + 16, $y + 38, $x + 48, $y + 38)
  $g.DrawLine((Pen "#ffffff55" 2), $x + 14, $y + 19, $x + 50, $y + 19)
  Frame $name $col $row
}

function Draw-Ground([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $g.FillRectangle((Brush "#82c85e"), $x, $y, 64, 30)
  $g.FillRectangle((Brush "#5f9f45"), $x, $y + 25, 64, 9)
  $g.FillRectangle((Brush "#c4884f"), $x, $y + 34, 64, 30)
  $g.FillRectangle((Brush "#a96f42"), $x, $y + 44, 64, 20)
  $g.DrawLine((Pen "#497c38" 2), $x, $y + 29, $x + 64, $y + 29)
  for ($i = 0; $i -lt 7; $i++) {
    $px = $x + 5 + $i * 9
    $g.FillEllipse((Brush "#855938"), $px, $y + 42 + (($i % 3) * 5), 5, 3)
  }
  Frame "ground" $col $row
}

function Draw-Sling([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $wood = Pen "#7d4a25" 8
  $wood.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $wood.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($wood, $x + 31, $y + 55, $x + 30, $y + 26)
  $g.DrawLine($wood, $x + 30, $y + 27, $x + 17, $y + 13)
  $g.DrawLine($wood, $x + 30, $y + 27, $x + 48, $y + 12)
  $g.DrawLine((Pen "#4b2a16" 3), $x + 31, $y + 55, $x + 30, $y + 26)
  $g.DrawLine((Pen "#d49d52" 3), $x + 25, $y + 50, $x + 24, $y + 29)
  $g.FillEllipse((Brush "#5b311a"), $x + 22, $y + 50, 18, 8)
  Frame "sling" $col $row
}

function Draw-Puff([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  foreach ($c in @(@(14, 28, 20), @(25, 20, 25), @(36, 27, 19), @(24, 34, 25), @(41, 39, 12))) {
    $g.FillEllipse((Brush "#ffffffcc"), $x + $c[0], $y + $c[1], $c[2], $c[2])
    $g.DrawEllipse((Pen "#a8beca88" 1), $x + $c[0], $y + $c[1], $c[2], $c[2])
  }
  Frame "puff" $col $row
}

function Draw-Star([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $points = @()
  for ($i = 0; $i -lt 10; $i++) {
    $r = if ($i % 2 -eq 0) { 24 } else { 10 }
    $a = (-90 + $i * 36) * [Math]::PI / 180
    $points += [System.Drawing.PointF]::new($x + 32 + [Math]::Cos($a) * $r, $y + 32 + [Math]::Sin($a) * $r)
  }
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddPolygon($points)
  $g.FillPath((Brush "#ffd760"), $path)
  $g.DrawPath((Pen "#c57b2c" 2), $path)
  Frame "star" $col $row
}

function Draw-Leaf([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddBezier($x + 10, $y + 34, $x + 20, $y + 6, $x + 49, $y + 12, $x + 53, $y + 35)
  $p.AddBezier($x + 53, $y + 35, $x + 42, $y + 56, $x + 17, $y + 53, $x + 10, $y + 34)
  $p.CloseFigure()
  $g.FillPath((Brush "#59b85b"), $p)
  $g.DrawPath((Pen "#2e7a3a" 2), $p)
  $g.DrawLine((Pen "#e4f1a4" 2), $x + 17, $y + 37, $x + 49, $y + 30)
  Frame "leaf" $col $row
}

Draw-Bird 0 0 "bird-red" "#e64b3c" "#b9272e" "#f8b13d"
Draw-Bird 1 0 "bird-blue" "#3c9be6" "#2367b0" "#ffd66b"
Draw-Bird 2 0 "bird-yellow" "#f4d340" "#d4912d" "#f08a27"
Draw-Target 3 0
Draw-Block 4 0 "wood-block" "#c78343" "#7a4624" "#9e6436"
Draw-Block 5 0 "stone-block" "#9ca9b4" "#5d6a73" "#cdd6dd"
Draw-Block 6 0 "glass-block" "#8edce8" "#3a91a1" "#d8fbff"
Draw-Ground 7 0
Draw-Sling 0 1
Draw-Puff 1 1
Draw-Star 2 1
Draw-Leaf 3 1
Draw-Block 4 1 "wood-long" "#bd7637" "#6f3f23" "#96582e"
Draw-Block 5 1 "stone-long" "#87949f" "#53606a" "#bdc7cf"
Draw-Block 6 1 "glass-long" "#7bcfdc" "#358898" "#cdf8ff"
Draw-Block 7 1 "crate" "#d09248" "#784b25" "#a66731"
Draw-Bird 0 2 "bird-purple" "#9562d8" "#60379c" "#f6c95a"
Draw-Bird 1 2 "bird-green" "#56b75d" "#2e8038" "#ffd36b"
Draw-Puff 2 2
Draw-Star 3 2
Draw-Leaf 4 2
Draw-Ground 5 2
Draw-Target 6 2
Draw-Sling 7 2

$sheetPath = Join-Path $assetDir "sprite-map.png"
$sheet.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)

$jsonPath = Join-Path $assetDir "sprite-map.json"
$jsonText = $atlas | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($jsonPath, $jsonText, $utf8NoBom)

$preview = New-Object System.Drawing.Bitmap ($cols * 104), ($rows * 90), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$pg = [System.Drawing.Graphics]::FromImage($preview)
$pg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$pg.Clear((ColorFromHex "#f4f7f0"))
$font = New-Object System.Drawing.Font "Segoe UI", 8
$nameBrush = Brush "#23313d"
$i = 0
foreach ($key in $atlas.frames.Keys) {
  $col = $i % $cols
  $row = [Math]::Floor($i / $cols)
  $dx = $col * 104 + 20
  $dy = $row * 90 + 8
  $frame = $atlas.frames[$key]
  $src = [System.Drawing.Rectangle]::new($frame.x, $frame.y, $frame.w, $frame.h)
  $dst = [System.Drawing.Rectangle]::new($dx, $dy, 48, 48)
  $pg.DrawImage($sheet, $dst, $src, [System.Drawing.GraphicsUnit]::Pixel)
  $pg.DrawRectangle((Pen "#9ba9a6" 1), $dst)
  $pg.DrawString($key, $font, $nameBrush, $col * 104 + 4, $dy + 56)
  $i++
}
$preview.Save((Join-Path $assetDir "sprite-map-preview.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$pg.Dispose()
$preview.Dispose()
$g.Dispose()
$sheet.Dispose()

Write-Host "Generated $sheetPath"
Write-Host "Generated $jsonPath"
