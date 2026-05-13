Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SpriteDir = Join-Path $Root "assets\sprites"
$PlayerSource = Join-Path $Root "assets\source\player_anim_atlas_imagen_key.png"
$NpcSource = Join-Path $Root "assets\source\npc_anim_atlas_imagen_key.png"
$OutSheet = Join-Path $SpriteDir "characters_imagen_hd_sheet.png"

$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb
$PngFormat = [System.Drawing.Imaging.ImageFormat]::Png
$FrameW = 192
$FrameH = 256
$DestCols = 16
$DestRows = 10

function New-Bitmap {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, $PixelFormat)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function New-Graphics {
  param([System.Drawing.Bitmap]$Bitmap)
  $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  return $graphics
}

function Convert-KeyToAlpha {
  param([System.Drawing.Bitmap]$Bitmap)

  $rect = New-Object System.Drawing.Rectangle(0, 0, $Bitmap.Width, $Bitmap.Height)
  $data = $Bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $PixelFormat)
  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1

  try {
    $bytes = New-Object byte[] ($data.Stride * $data.Height)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    for ($y = 0; $y -lt $Bitmap.Height; $y += 1) {
      $row = $y * $data.Stride
      for ($x = 0; $x -lt $Bitmap.Width; $x += 1) {
        $i = $row + ($x * 4)
        $b = [int]$bytes[$i]
        $g = [int]$bytes[$i + 1]
        $r = [int]$bytes[$i + 2]
        $magentaScore = [Math]::Min($r, $b) - $g
        $nearKey = ($r -gt 85 -and $b -gt 85 -and $magentaScore -gt 40 -and [Math]::Abs($r - $b) -lt 165)
        if ($nearKey) {
          $bytes[$i] = 0
          $bytes[$i + 1] = 0
          $bytes[$i + 2] = 0
          $bytes[$i + 3] = 0
        } else {
          if ($r -gt 70 -and $b -gt 70 -and $magentaScore -gt 18 -and [Math]::Abs($r - $b) -lt 175) {
            $bytes[$i] = [byte][Math]::Max(0, $b - 64)
            $bytes[$i + 2] = [byte][Math]::Max(0, $r - 64)
          }
          if ($bytes[$i + 3] -gt 12) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
          }
        }
      }
    }
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  } finally {
    $Bitmap.UnlockBits($data)
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) {
    return New-Object System.Drawing.Rectangle(0, 0, $Bitmap.Width, $Bitmap.Height)
  }

  $pad = 2
  $x0 = [Math]::Max(0, $minX - $pad)
  $y0 = [Math]::Max(0, $minY - $pad)
  $x1 = [Math]::Min($Bitmap.Width - 1, $maxX + $pad)
  $y1 = [Math]::Min($Bitmap.Height - 1, $maxY + $pad)
  return New-Object System.Drawing.Rectangle($x0, $y0, ($x1 - $x0 + 1), ($y1 - $y0 + 1))
}

function Get-CleanCell {
  param(
    [System.Drawing.Bitmap]$Atlas,
    [int]$Cols,
    [int]$Rows,
    [int]$Col,
    [int]$Row
  )

  $cellW = [int]($Atlas.Width / $Cols)
  $cellH = [int]($Atlas.Height / $Rows)
  $srcRect = New-Object System.Drawing.Rectangle(($Col * $cellW), ($Row * $cellH), $cellW, $cellH)
  $cell = $Atlas.Clone($srcRect, $PixelFormat)
  $bounds = Convert-KeyToAlpha $cell
  return [pscustomobject]@{
    Bitmap = $cell
    Bounds = $bounds
  }
}

function Draw-NormalizedFrame {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Source,
    [System.Drawing.Rectangle]$Bounds,
    [int]$DestRow,
    [int]$DestCol,
    [float]$MaxW = 168,
    [float]$MaxH = 242,
    [switch]$LockHeight
  )

  $scale = if ($LockHeight) {
    $MaxH / [Math]::Max(1, $Bounds.Height)
  } else {
    [Math]::Min($MaxW / [Math]::Max(1, $Bounds.Width), $MaxH / [Math]::Max(1, $Bounds.Height))
  }
  $drawW = [int][Math]::Round($Bounds.Width * $scale)
  $drawH = [int][Math]::Round($Bounds.Height * $scale)
  $destX = ($DestCol * $FrameW) + [int](($FrameW - $drawW) / 2)
  $destY = ($DestRow * $FrameH) + ($FrameH - $drawH - 5)
  $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $drawW, $drawH)
  $frameRect = New-Object System.Drawing.Rectangle(($DestCol * $FrameW), ($DestRow * $FrameH), $FrameW, $FrameH)
  $state = $Graphics.Save()
  try {
    $Graphics.SetClip($frameRect)
    $Graphics.DrawImage($Source, $destRect, $Bounds, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $Graphics.Restore($state)
  }
}

function Draw-AtlasRow {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Atlas,
    [int]$AtlasCols,
    [int]$AtlasRows,
    [int]$SourceRow,
    [int]$DestRow,
    [float]$MaxW,
    [float]$MaxH,
    [switch]$LockHeight
  )

  for ($destCol = 0; $destCol -lt $DestCols; $destCol += 1) {
    $sourceCol = [Math]::Min($AtlasCols - 1, [int][Math]::Floor(($destCol * $AtlasCols) / $DestCols))
    $cell = Get-CleanCell $Atlas $AtlasCols $AtlasRows $sourceCol $SourceRow
    try {
      Draw-NormalizedFrame $Graphics $cell.Bitmap $cell.Bounds $DestRow $destCol $MaxW $MaxH -LockHeight:$LockHeight
    } finally {
      $cell.Bitmap.Dispose()
    }
  }
}

function Build-ImagenCharacterSheet {
  if (!(Test-Path $PlayerSource) -or !(Test-Path $NpcSource)) {
    throw "Missing Imagen animation atlas source files."
  }

  New-Item -ItemType Directory -Force -Path $SpriteDir | Out-Null
  $sheet = New-Bitmap ($FrameW * $DestCols) ($FrameH * $DestRows)
  $graphics = New-Graphics $sheet
  $player = [System.Drawing.Bitmap]::FromFile($PlayerSource)
  $npcs = [System.Drawing.Bitmap]::FromFile($NpcSource)

  try {
    Draw-AtlasRow $graphics $player 8 6 0 0 168 242
    Draw-AtlasRow $graphics $player 8 6 1 1 176 242
    Draw-AtlasRow $graphics $player 8 6 2 2 176 242
    Draw-AtlasRow $graphics $player 8 6 3 3 168 242
    Draw-AtlasRow $graphics $player 8 6 4 4 178 242
    Draw-AtlasRow $graphics $player 8 6 5 5 178 242

    Draw-AtlasRow $graphics $npcs 8 4 0 6 184 246 -LockHeight
    Draw-AtlasRow $graphics $npcs 8 4 1 7 184 246 -LockHeight
    Draw-AtlasRow $graphics $npcs 8 4 2 8 184 246 -LockHeight
    Draw-AtlasRow $graphics $npcs 8 4 3 9 184 246 -LockHeight
  } finally {
    $graphics.Dispose()
    $player.Dispose()
    $npcs.Dispose()
  }

  $sheet.Save($OutSheet, $PngFormat)
  $sheet.Dispose()
  Write-Host "Wrote $OutSheet"
}

Build-ImagenCharacterSheet
