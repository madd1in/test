Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $root "assets"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

function ColorFromHex($hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function SolidBrush($hex) {
  return New-Object System.Drawing.SolidBrush (ColorFromHex $hex)
}

function FillRect($g, $hex, $x, $y, $w, $h) {
  $b = SolidBrush $hex
  $g.FillRectangle($b, [int]$x, [int]$y, [int]$w, [int]$h)
  $b.Dispose()
}

function StrokeRect($g, $hex, $x, $y, $w, $h, $thickness = 1) {
  $p = New-Object System.Drawing.Pen (ColorFromHex $hex), $thickness
  $g.DrawRectangle($p, [int]$x, [int]$y, [int]$w, [int]$h)
  $p.Dispose()
}

function FillPoly($g, $hex, [System.Drawing.Point[]]$points) {
  $b = SolidBrush $hex
  $g.FillPolygon($b, $points)
  $b.Dispose()
}

function DrawLine($g, $hex, $x1, $y1, $x2, $y2, $thickness = 1) {
  $p = New-Object System.Drawing.Pen (ColorFromHex $hex), $thickness
  $g.DrawLine($p, [int]$x1, [int]$y1, [int]$x2, [int]$y2)
  $p.Dispose()
}

function New-Bitmap($w, $h) {
  return New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function New-Graphics($bitmap) {
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  return $g
}

function CellRect($col, $row, $tile) {
  return @{ X = $col * $tile; Y = $row * $tile }
}

function Draw-StoneNoise($g, $x, $y, $seedColor) {
  FillRect $g $seedColor ($x + 4) ($y + 6) 8 3
  FillRect $g "#7e7f78" ($x + 17) ($y + 9) 10 2
  FillRect $g "#5b625f" ($x + 7) ($y + 18) 11 3
  FillRect $g "#9a9d8f" ($x + 21) ($y + 22) 5 2
  DrawLine $g "#464b49" ($x + 2) ($y + 27) ($x + 29) ($y + 24) 1
}

function Draw-GrassBlock($g, $x, $y) {
  FillRect $g "#55645f" $x ($y + 8) 32 24
  FillRect $g "#3d4847" $x ($y + 24) 32 8
  FillRect $g "#76b65b" $x $y 32 8
  FillRect $g "#a8df72" $x $y 32 3
  FillRect $g "#46783e" ($x + 3) ($y + 7) 5 7
  FillRect $g "#46783e" ($x + 15) ($y + 7) 4 5
  FillRect $g "#46783e" ($x + 25) ($y + 7) 3 6
  Draw-StoneNoise $g $x $y "#778079"
  StrokeRect $g "#2a2f2e" $x $y 31 31 1
}

function Draw-StoneBlock($g, $x, $y, $warm = $false) {
  $base = if ($warm) { "#a88857" } else { "#69706e" }
  $dark = if ($warm) { "#765c3b" } else { "#474d4d" }
  $lite = if ($warm) { "#d4b36f" } else { "#969d94" }
  FillRect $g $base $x $y 32 32
  FillRect $g $dark $x ($y + 24) 32 8
  FillRect $g $lite ($x + 2) ($y + 2) 28 3
  DrawLine $g $dark ($x + 2) ($y + 12) ($x + 30) ($y + 10) 1
  DrawLine $g $dark ($x + 9) ($y + 2) ($x + 8) ($y + 26) 1
  DrawLine $g $dark ($x + 20) ($y + 11) ($x + 21) ($y + 31) 1
  FillRect $g $lite ($x + 13) ($y + 16) 5 2
  StrokeRect $g "#2b302f" $x $y 31 31 1
}

function Draw-Plank($g, $x, $y) {
  FillRect $g "#8e6138" $x ($y + 9) 32 15
  FillRect $g "#b47b45" $x ($y + 9) 32 4
  DrawLine $g "#583923" $x ($y + 15) ($x + 31) ($y + 15) 1
  DrawLine $g "#583923" ($x + 10) ($y + 10) ($x + 10) ($y + 23) 1
  DrawLine $g "#583923" ($x + 22) ($y + 10) ($x + 22) ($y + 23) 1
  FillRect $g "#ffd072" ($x + 6) ($y + 13) 2 2
  FillRect $g "#ffd072" ($x + 25) ($y + 20) 2 2
}

function Draw-Bounce($g, $x, $y) {
  FillRect $g "#44404e" $x ($y + 6) 32 26
  FillRect $g "#ffcc66" ($x + 2) ($y + 5) 28 7
  FillRect $g "#ff8c4a" ($x + 5) ($y + 12) 22 4
  FillRect $g "#2b2a34" ($x + 4) ($y + 23) 24 7
  StrokeRect $g "#201f29" $x ($y + 5) 31 26 1
}

function Draw-Cloud($g, $x, $y) {
  FillRect $g "#d6f7ff" ($x + 7) ($y + 13) 19 10
  FillRect $g "#ffffff" ($x + 10) ($y + 9) 8 8
  FillRect $g "#ffffff" ($x + 16) ($y + 11) 10 9
  FillRect $g "#b6dbe7" ($x + 7) ($y + 21) 22 3
}

function Draw-Vine($g, $x, $y) {
  FillRect $g "#3f7d47" ($x + 14) $y 4 32
  FillRect $g "#75bc58" ($x + 18) ($y + 4) 7 4
  FillRect $g "#75bc58" ($x + 7) ($y + 12) 8 4
  FillRect $g "#75bc58" ($x + 18) ($y + 23) 8 4
}

function Draw-Ladder($g, $x, $y) {
  FillRect $g "#8a5937" ($x + 8) $y 4 32
  FillRect $g "#8a5937" ($x + 20) $y 4 32
  foreach ($r in 4, 12, 20, 28) {
    FillRect $g "#c88b4a" ($x + 8) ($y + $r) 16 3
  }
}

function Draw-PortalTile($g, $x, $y, $phase) {
  FillRect $g "#35294b" ($x + 7) $y 18 32
  FillRect $g "#6de4ff" ($x + 10) ($y + 3) 12 26
  FillRect $g "#fff2a1" ($x + 13) ($y + 6 + $phase) 6 12
  StrokeRect $g "#1f1830" ($x + 7) $y 17 31 1
}

function Draw-ShardTile($g, $x, $y) {
  $points = @(
    [System.Drawing.Point]::new($x + 16, $y + 3),
    [System.Drawing.Point]::new($x + 26, $y + 15),
    [System.Drawing.Point]::new($x + 18, $y + 29),
    [System.Drawing.Point]::new($x + 6, $y + 19)
  )
  FillPoly $g "#7df3ff" $points
  FillPoly $g "#fff6a7" @(
    [System.Drawing.Point]::new($x + 16, $y + 5),
    [System.Drawing.Point]::new($x + 21, $y + 15),
    [System.Drawing.Point]::new($x + 16, $y + 18),
    [System.Drawing.Point]::new($x + 11, $y + 16)
  )
  DrawLine $g "#2f91b2" ($x + 16) ($y + 4) ($x + 18) ($y + 28) 1
}

function Draw-TileMap {
  $tile = 32
  $bmp = New-Bitmap ($tile * 8) ($tile * 4)
  $g = New-Graphics $bmp

  Draw-GrassBlock $g 0 0
  Draw-StoneBlock $g 32 0 $false
  Draw-StoneBlock $g 64 0 $true
  Draw-Plank $g 96 0
  Draw-Bounce $g 128 0
  Draw-Cloud $g 160 0
  Draw-Vine $g 192 0
  Draw-Ladder $g 224 0

  Draw-PortalTile $g 0 32 0
  Draw-PortalTile $g 32 32 5
  Draw-ShardTile $g 64 32
  Draw-GrassBlock $g 96 32
  FillRect $g "#79c8ef" 128 32 32 32
  FillRect $g "#55aedd" 128 54 32 10
  DrawLine $g "#bff8ff" 129 45 157 42 1
  Draw-StoneBlock $g 160 32 $false
  FillRect $g "#4f665d" 160 55 32 9
  Draw-StoneBlock $g 192 32 $true
  FillRect $g "#5a402d" 202 40 12 24
  FillRect $g "#3e7f52" 195 34 26 10
  FillRect $g "#69b85c" 199 31 17 7
  FillRect $g "#2d2f40" 224 32 32 32
  FillRect $g "#ffdf78" 229 37 22 22
  FillRect $g "#ff875f" 233 41 14 14

  for ($c = 0; $c -lt 8; $c++) {
    Draw-StoneBlock $g ($c * 32) 64 (($c % 2) -eq 0)
    if (($c % 3) -eq 0) { FillRect $g "#74ba58" ($c * 32) 64 32 4 }
  }

  for ($c = 0; $c -lt 8; $c++) {
    Draw-Cloud $g ($c * 32) 96
    FillRect $g "#83d3f2" ($c * 32) 122 32 6
  }

  $out = Join-Path $assetsDir "foldscape_tilemap.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-Player($g, $x, $y, $frame, $jumping = $false) {
  FillRect $g "#192432" ($x + 12) ($y + 58) 24 4

  $bob = if ($jumping) { -5 } elseif (($frame % 2) -eq 0) { 1 } else { 0 }
  $legA = if (($frame % 2) -eq 0) { -2 } else { 3 }
  $legB = -$legA
  $baseY = $y + $bob

  FillRect $g "#33435b" ($x + 17 + $legA) ($baseY + 42) 7 15
  FillRect $g "#33435b" ($x + 25 + $legB) ($baseY + 42) 7 15
  FillRect $g "#211f2c" ($x + 15 + $legA) ($baseY + 55) 10 4
  FillRect $g "#211f2c" ($x + 25 + $legB) ($baseY + 55) 10 4

  FillRect $g "#58a3a5" ($x + 15) ($baseY + 25) 20 20
  FillRect $g "#3a757f" ($x + 15) ($baseY + 40) 20 6
  FillRect $g "#f4b26e" ($x + 12) ($baseY + 29) 5 12
  FillRect $g "#f4b26e" ($x + 34) ($baseY + 29) 5 12
  FillRect $g "#f0c08a" ($x + 18) ($baseY + 13) 16 15
  FillRect $g "#6a3e2f" ($x + 17) ($baseY + 13) 18 5
  FillRect $g "#201d25" ($x + 29) ($baseY + 20) 2 2
  FillRect $g "#201d25" ($x + 22) ($baseY + 20) 2 2
  FillRect $g "#d9473f" ($x + 16) ($baseY + 8) 19 7
  FillRect $g "#ef6651" ($x + 20) ($baseY + 5) 14 5
  FillRect $g "#7d2730" ($x + 34) ($baseY + 9) 3 8
  FillRect $g "#ffef9f" ($x + 19) ($baseY + 30) 5 4
}

function Draw-SpriteSheet {
  $fw = 48
  $fh = 64
  $bmp = New-Bitmap ($fw * 8) ($fh * 4)
  $g = New-Graphics $bmp

  for ($i = 0; $i -lt 8; $i++) {
    Draw-Player $g ($i * $fw) 0 $i ($i -eq 5)
  }

  for ($i = 0; $i -lt 4; $i++) {
    $x = $i * $fw
    $y = $fh
    $shift = ($i % 2) * 2
    FillRect $g "#091622" ($x + 14) ($y + 45) 20 4
    FillPoly $g "#7df3ff" @(
      [System.Drawing.Point]::new($x + 24, $y + 10 + $shift),
      [System.Drawing.Point]::new($x + 36, $y + 26),
      [System.Drawing.Point]::new($x + 27, $y + 48 - $shift),
      [System.Drawing.Point]::new($x + 12, $y + 30)
    )
    FillPoly $g "#fff0a1" @(
      [System.Drawing.Point]::new($x + 24, $y + 13 + $shift),
      [System.Drawing.Point]::new($x + 29, $y + 26),
      [System.Drawing.Point]::new($x + 23, $y + 30),
      [System.Drawing.Point]::new($x + 17, $y + 27)
    )
  }

  for ($i = 4; $i -lt 8; $i++) {
    $x = $i * $fw
    $y = $fh
    FillRect $g "#2d233c" ($x + 14) ($y + 15) 20 32
    FillRect $g "#6de4ff" ($x + 17) ($y + 18) 14 26
    FillRect $g "#fff2a1" ($x + 20) ($y + 22 + ($i % 2) * 3) 8 13
    StrokeRect $g "#181024" ($x + 14) ($y + 15) 19 31 1
  }

  for ($i = 0; $i -lt 8; $i++) {
    $x = $i * $fw
    $y = $fh * 2
    FillRect $g "#ffffff" ($x + 18) ($y + 30) 12 4
    FillRect $g "#d6f7ff" ($x + 13) ($y + 35) 22 6
    FillRect $g "#9cc7d8" ($x + 17) ($y + 42) 14 3
    if (($i % 2) -eq 0) {
      FillRect $g "#fff3a6" ($x + 23) ($y + 22) 3 3
      FillRect $g "#fff3a6" ($x + 30) ($y + 26) 2 2
    }
  }

  for ($i = 0; $i -lt 4; $i++) {
    $x = $i * $fw
    $y = $fh * 3
    FillRect $g "#f5c053" ($x + 15) ($y + 30) 18 8
    FillRect $g "#f8d97d" ($x + 20) ($y + 24) 8 8
    FillRect $g "#6a4b2b" ($x + 30) ($y + 33) 6 4
  }
  for ($i = 4; $i -lt 8; $i++) {
    $x = $i * $fw
    $y = $fh * 3
    FillRect $g "#9be86d" ($x + 10) ($y + 42 - (($i % 2) * 6)) 28 5
    FillRect $g "#ffffff" ($x + 20) ($y + 25) 8 8
    FillRect $g "#ffea85" ($x + 23) ($y + 19) 3 20
  }

  $out = Join-Path $assetsDir "foldscape_sprite_sheet.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Draw-TileMap
Draw-SpriteSheet

$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("s")
  tilemap = "assets/foldscape_tilemap.png"
  tileSize = 32
  spriteSheet = "assets/foldscape_sprite_sheet.png"
  spriteFrame = @{ width = 48; height = 64 }
  imported = @{
    conceptSheet = "assets/imported/imagegen-concept-sheet.png"
    backdrop = "assets/imported/observatory.png"
    bgm = "assets/audio/mossy-warp-zone.mp3"
  }
  tiles = [ordered]@{
    grass = 0
    stone = 1
    sandstone = 2
    plank = 3
    bounce = 4
    cloud = 5
    vine = 6
    ladder = 7
    portalA = 8
    portalB = 9
    shard = 10
    water = 12
    tree = 14
    lantern = 15
  }
  sprites = [ordered]@{
    player = @(0, 1, 2, 3, 4, 5, 6, 7)
    shard = @(8, 9, 10, 11)
    portal = @(12, 13, 14, 15)
    cloud = @(16, 17, 18, 19, 20, 21, 22, 23)
    key = @(24, 25, 26, 27)
    sparkle = @(28, 29, 30, 31)
  }
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $assetsDir "asset-manifest.json") -Encoding UTF8
Write-Host "Built foldscape assets in $assetsDir"
