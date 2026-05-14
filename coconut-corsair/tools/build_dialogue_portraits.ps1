Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SpriteDir = Join-Path $Root "assets\sprites"
$SourceDir = Join-Path $Root "assets\source"
$OutSheet = Join-Path $SpriteDir "dialogue_portraits.png"
$SourceMirror = Join-Path $SourceDir "dialogue_portraits_source.png"

$FrameW = 192
$FrameH = 256
$Cell = 144
$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb
$PngFormat = [System.Drawing.Imaging.ImageFormat]::Png

$Sheets = @{
  characters = Join-Path $SpriteDir "characters_imagen_hd_sheet.png"
  extras = Join-Path $SpriteDir "npcs_market_observatory_normalized_sheet.png"
  keeper = Join-Path $SpriteDir "keeper_moon_door_solid_sheet.png"
}

$Portraits = @(
  @{ Name = "Mara";       Sheet = "characters"; Row = 3; Col = 2; CenterX = 82; Width = 126; Height = 142; TopPad = 8  },
  @{ Name = "Dockmaster"; Sheet = "characters"; Row = 6; Col = 4; CenterX = 82; Width = 136; Height = 142; TopPad = 8;  CropY = 28 },
  @{ Name = "Barkeep";    Sheet = "characters"; Row = 7; Col = 4; CenterX = 84; Width = 132; Height = 142; TopPad = 6;  CropY = 30 },
  @{ Name = "Smuggler";   Sheet = "extras";     Row = 1; Col = 0; CenterX = 84; Width = 138; Height = 142; TopPad = 8  },
  @{ Name = "Keeper";     Sheet = "keeper";     Row = 0; Col = 4; CenterX = 78; Width = 132; Height = 146; TopPad = 8  },
  @{ Name = "Archivist";  Sheet = "extras";     Row = 3; Col = 2; CenterX = 84; Width = 132; Height = 146; TopPad = 10 }
)

function New-Bitmap {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, $PixelFormat)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function Get-VisibleBounds {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$FrameX,
    [int]$FrameY
  )

  $colCounts = New-Object int[] $FrameW
  $rowCounts = New-Object int[] $FrameH

  for ($y = 0; $y -lt $FrameH; $y += 1) {
    for ($x = 0; $x -lt $FrameW; $x += 1) {
      $pixel = $Bitmap.GetPixel($FrameX + $x, $FrameY + $y)
      if ($pixel.A -gt 18) {
        $colCounts[$x] += 1
        $rowCounts[$y] += 1
      }
    }
  }

  $minX = $FrameW
  $minY = $FrameH
  $maxX = -1
  $maxY = -1

  for ($x = 0; $x -lt $FrameW; $x += 1) {
    if ($colCounts[$x] -ge 4) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
    }
  }

  for ($y = 0; $y -lt $FrameH; $y += 1) {
    if ($rowCounts[$y] -ge 4) {
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }

  if ($maxX -lt 0) {
    throw "No visible pixels found in portrait source frame."
  }

  return [PSCustomObject]@{
    MinX = $minX
    MinY = $minY
    MaxX = $maxX
    MaxY = $maxY
  }
}

function Get-Clamped {
  param([int]$Value, [int]$Min, [int]$Max)
  return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Draw-Portrait {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Source,
    [hashtable]$Spec,
    [int]$Index
  )

  $frameX = [int]$Spec.Col * $FrameW
  $frameY = [int]$Spec.Row * $FrameH
  $bounds = Get-VisibleBounds -Bitmap $Source -FrameX $frameX -FrameY $frameY

  $cropW = [int]$Spec.Width
  $cropH = [int]$Spec.Height
  $cropX = Get-Clamped -Value ([int]([double]$Spec.CenterX - ($cropW / 2))) -Min 0 -Max ($FrameW - $cropW)
  if ($Spec.ContainsKey("CropY")) {
    $cropY = Get-Clamped -Value ([int]$Spec.CropY) -Min 0 -Max ($FrameH - $cropH)
  } else {
    $cropY = Get-Clamped -Value ($bounds.MinY - [int]$Spec.TopPad) -Min 0 -Max ($FrameH - $cropH)
  }

  $scale = [Math]::Min(($Cell - 14) / $cropW, ($Cell - 10) / $cropH)
  $destW = [int][Math]::Round($cropW * $scale)
  $destH = [int][Math]::Round($cropH * $scale)
  $destX = ($Index * $Cell) + [int][Math]::Round(($Cell - $destW) / 2)
  $destY = [int][Math]::Round(($Cell - $destH) / 2) + 4

  $srcRect = [System.Drawing.Rectangle]::new(($frameX + $cropX), ($frameY + $cropY), $cropW, $cropH)
  $destRect = [System.Drawing.Rectangle]::new($destX, $destY, $destW, $destH)
  $Graphics.DrawImage($Source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
}

$loadedSheets = @{}
try {
  foreach ($key in $Sheets.Keys) {
    $loadedSheets[$key] = New-Object System.Drawing.Bitmap($Sheets[$key])
  }

  $output = New-Bitmap -Width ($Cell * $Portraits.Count) -Height $Cell
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    for ($i = 0; $i -lt $Portraits.Count; $i += 1) {
      $spec = $Portraits[$i]
      Draw-Portrait -Graphics $graphics -Source $loadedSheets[$spec.Sheet] -Spec $spec -Index $i
    }

    $output.Save($OutSheet, $PngFormat)
    $output.Save($SourceMirror, $PngFormat)
  } finally {
    $graphics.Dispose()
    $output.Dispose()
  }
} finally {
  foreach ($bitmap in $loadedSheets.Values) {
    $bitmap.Dispose()
  }
}

Write-Output "Built dialogue portraits: $OutSheet"
