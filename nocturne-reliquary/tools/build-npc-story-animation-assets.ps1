Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Generated = Join-Path $Root "assets\generated"
$SourceAtlas = Join-Path $Generated "npc_imagen_story_atlas_v1.png"
$OutSheet = Join-Path $Generated "npc_imagen_story_sprites_16f.png"
$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb

$FrameW = 192
$FrameH = 256
$Frames = 16
$NpcCount = 4

function New-TransparentBitmap {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, $PixelFormat)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } finally {
    $graphics.Dispose()
  }
  return $bitmap
}

function Set-Quality {
  param([System.Drawing.Graphics]$Graphics)
  $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
}

function Copy-Bitmap {
  param([System.Drawing.Image]$Image)
  $bitmap = New-TransparentBitmap $Image.Width $Image.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    Set-Quality $graphics
    $graphics.DrawImage($Image, 0, 0, $Image.Width, $Image.Height)
  } finally {
    $graphics.Dispose()
  }
  return $bitmap
}

function Get-AtlasCell {
  param(
    [System.Drawing.Bitmap]$Atlas,
    [int]$Col,
    [int]$Cols,
    [int]$Y,
    [int]$Height
  )
  $x0 = [Math]::Round($Col * $Atlas.Width / $Cols)
  $x1 = [Math]::Round(($Col + 1) * $Atlas.Width / $Cols)
  $rect = New-Object System.Drawing.Rectangle($x0, $Y, ($x1 - $x0), $Height)
  return Copy-Bitmap ($Atlas.Clone($rect, $PixelFormat))
}

function Remove-StoryMatte {
  param([System.Drawing.Bitmap]$Bitmap)
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $c = $Bitmap.GetPixel($x, $y)
      if ($c.A -le 0) { continue }
      $r = [int]$c.R
      $g = [int]$c.G
      $b = [int]$c.B
      $maxRb = [Math]::Max($r, $b)
      $minRgb = [Math]::Min($r, [Math]::Min($g, $b))
      $green = $g -gt 68 -and ($g - $maxRb) -gt 12 -and $g -gt ($r * 1.08) -and $g -gt ($b * 1.04)
      $whiteGrid = $r -gt 232 -and $g -gt 232 -and $b -gt 232
      $flatMatte = ($maxRb - $minRgb) -lt 8 -and ($r + $g + $b) -lt 36
      if ($green -or $whiteGrid -or $flatMatte) {
        $dominance = [Math]::Max(0, $g - $maxRb - 10)
        $alpha = if ($green) { [Math]::Max(0, [Math]::Round($c.A * (1 - [Math]::Min(1, $dominance / 72)))) } else { 0 }
        if ($dominance -gt 34 -or $whiteGrid -or $flatMatte) { $alpha = 0 }
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, [Math]::Min($g, $maxRb + 14), $b))
      } elseif ($g -gt ($maxRb + 22)) {
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, $r, [Math]::Min($g, $maxRb + 16), $b))
      }
    }
  }
}

function Get-AlphaBounds {
  param([System.Drawing.Bitmap]$Bitmap)
  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $a = $Bitmap.GetPixel($x, $y).A
      if ($a -gt 18) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt $minX -or $maxY -lt $minY) { return $null }
  $pad = 8
  $x0 = [Math]::Max(0, $minX - $pad)
  $y0 = [Math]::Max(0, $minY - $pad)
  $x1 = [Math]::Min($Bitmap.Width, $maxX + $pad + 1)
  $y1 = [Math]::Min($Bitmap.Height, $maxY + $pad + 1)
  return New-Object System.Drawing.Rectangle($x0, $y0, ($x1 - $x0), ($y1 - $y0))
}

function Normalize-Sprite {
  param(
    [System.Drawing.Bitmap]$Cell,
    [int]$TargetW,
    [int]$TargetH
  )
  Remove-StoryMatte $Cell
  $bounds = Get-AlphaBounds $Cell
  if ($null -eq $bounds) {
    throw "NPC source cell lost all visible pixels during matte removal."
  }
  $trimmed = Copy-Bitmap ($Cell.Clone($bounds, $PixelFormat))
  $scale = [Math]::Min($TargetW / $trimmed.Width, $TargetH / $trimmed.Height)
  $w = [Math]::Max(1, [Math]::Round($trimmed.Width * $scale))
  $h = [Math]::Max(1, [Math]::Round($trimmed.Height * $scale))
  $out = New-TransparentBitmap $TargetW $TargetH
  $graphics = [System.Drawing.Graphics]::FromImage($out)
  try {
    Set-Quality $graphics
    $x = [Math]::Round(($TargetW - $w) / 2)
    $y = $TargetH - $h
    $graphics.DrawImage($trimmed, $x, $y, $w, $h)
  } finally {
    $graphics.Dispose()
    $trimmed.Dispose()
  }
  return $out
}

function Draw-IdleFrame {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Sprite,
    [int]$Row,
    [int]$Frame
  )
  $phase = 2 * [Math]::PI * $Frame / $Frames
  $breath = [Math]::Sin($phase)
  $slow = [Math]::Sin($phase * 0.5)
  $scaleX = 1 - ($breath * 0.006)
  $scaleY = 1 + ($breath * 0.015)
  $destW = [Math]::Round($Sprite.Width * $scaleX)
  $destH = [Math]::Round($Sprite.Height * $scaleY)
  $x = ($Frame * $FrameW) + [Math]::Round(($FrameW - $destW) / 2) + [Math]::Round($slow * 2)
  $y = ($Row * $FrameH) + $FrameH - 12 - $destH + [Math]::Round($breath * 2)
  $Graphics.DrawImage($Sprite, $x, $y, $destW, $destH)
}

$atlas = [System.Drawing.Bitmap]::FromFile($SourceAtlas)
$out = New-TransparentBitmap ($FrameW * $Frames) ($FrameH * $NpcCount)
$graphics = [System.Drawing.Graphics]::FromImage($out)
$sprites = @()

try {
  Set-Quality $graphics
  $targetSizes = @(
    @{ w = 138; h = 226 },
    @{ w = 152; h = 232 },
    @{ w = 140; h = 226 },
    @{ w = 138; h = 226 }
  )
  for ($row = 0; $row -lt $NpcCount; $row++) {
    $cell = Get-AtlasCell $atlas $row 4 452 464
    try {
      $sprite = Normalize-Sprite $cell $targetSizes[$row].w $targetSizes[$row].h
      $sprites += $sprite
      for ($frame = 0; $frame -lt $Frames; $frame++) {
        Draw-IdleFrame $graphics $sprite $row $frame
      }
    } finally {
      $cell.Dispose()
    }
  }
  $out.Save($OutSheet, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  foreach ($sprite in $sprites) { $sprite.Dispose() }
  $out.Dispose()
  $atlas.Dispose()
}

Write-Output "Wrote assets/generated/npc_imagen_story_sprites_16f.png ($($FrameW * $Frames)x$($FrameH * $NpcCount))"
