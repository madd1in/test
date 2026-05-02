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
    note = "Generated local original sprite map for Castle Fling: Nocturne."
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

function Draw-Relic([int]$col, [int]$row, [string]$name, [string]$body, [string]$accent, [string]$glow) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $g.FillEllipse((Brush "#00000022"), $x + 15, $y + 47, 36, 8)
  $halo = New-Object System.Drawing.Drawing2D.GraphicsPath
  $halo.AddEllipse($x + 7, $y + 7, 50, 50)
  $g.FillPath((Brush "#553a44aa"), $halo)
  $g.FillEllipse((Brush $body), $x + 14, $y + 12, 36, 36)
  $g.DrawEllipse((Pen "#f0d79a" 2), $x + 14, $y + 12, 36, 36)
  $g.FillEllipse((Brush "#fff2c966"), $x + 21, $y + 17, 13, 9)
  $g.DrawLine((Pen $accent 5), $x + 32, $y + 17, $x + 32, $y + 43)
  $g.DrawLine((Pen $accent 4), $x + 23, $y + 29, $x + 41, $y + 29)
  $g.DrawLine((Pen "#22131c" 2), $x + 32, $y + 18, $x + 32, $y + 42)
  $g.DrawLine((Pen "#22131c" 1.5), $x + 24, $y + 29, $x + 40, $y + 29)
  $tip = New-Object System.Drawing.Drawing2D.GraphicsPath
  $tip.AddPolygon(@(
    [System.Drawing.PointF]::new($x + 48, $y + 27),
    [System.Drawing.PointF]::new($x + 60, $y + 32),
    [System.Drawing.PointF]::new($x + 48, $y + 37)
  ))
  $g.FillPath((Brush "#e6d6b3"), $tip)
  $g.DrawPath((Pen "#6f4a2e" 1.2), $tip)
  $g.DrawEllipse((Pen "#00000055" 1.4), $x + 14, $y + 12, 36, 36)
  Frame $name $col $row
}

function Draw-Target([int]$col, [int]$row) {
  $o = CellOrigin $col $row
  $x = $o[0]
  $y = $o[1]
  $g.FillEllipse((Brush "#00000022"), $x + 16, $y + 49, 34, 7)
  $g.FillEllipse((Brush "#d9caa7"), $x + 15, $y + 11, 35, 38)
  $g.FillRectangle((Brush "#d9caa7"), $x + 25, $y + 38, 16, 11)
  $g.FillEllipse((Brush "#17111a"), $x + 22, $y + 24, 9, 11)
  $g.FillEllipse((Brush "#17111a"), $x + 37, $y + 24, 9, 11)
  $g.FillPolygon((Brush "#17111a"), @(
    [System.Drawing.Point]::new($x + 32, $y + 33),
    [System.Drawing.Point]::new($x + 29, $y + 40),
    [System.Drawing.Point]::new($x + 35, $y + 40)
  ))
  for ($i = 0; $i -lt 4; $i++) {
    $g.FillRectangle((Brush "#17111a"), $x + 25 + $i * 5, $y + 43, 3, 6)
  }
  $g.DrawEllipse((Pen "#6f5d46" 1.6), $x + 15, $y + 11, 35, 38)
  Frame "skull" $col $row
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

Draw-Relic 0 0 "relic-crimson" "#8e2f3e" "#f0d79a" "#d94b55"
Draw-Relic 1 0 "relic-azure" "#274f86" "#d7efff" "#5ab3e5"
Draw-Relic 2 0 "relic-gold" "#9b6a23" "#fff0a8" "#f4d05f"
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
Draw-Relic 0 2 "relic-violet" "#5c3f7f" "#ead8ff" "#9e75cc"
Draw-Relic 1 2 "relic-emerald" "#2f6d51" "#dcffd8" "#62bf7a"
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
