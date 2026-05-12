Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Generated = Join-Path $Root "assets\generated"
$PlayerSource = Join-Path $Generated "player_sheet_anim.png"
$WhipSource = Join-Path $Generated "whip_sheet.png"
$PlayerOut = Join-Path $Generated "player_sheet_imagen_hd_48.png"
$WhipOut = Join-Path $Generated "whip_sheet_imagen_hd_16.png"

$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb

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

function Get-Frame {
  param(
    [System.Drawing.Bitmap]$Sheet,
    [int]$Index,
    [int]$FrameWidth,
    [int]$FrameHeight
  )
  $rect = New-Object System.Drawing.Rectangle($($Index * $FrameWidth), 0, $FrameWidth, $FrameHeight)
  return $Sheet.Clone($rect, $PixelFormat)
}

function Draw-ImageAlpha {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height,
    [float]$Alpha
  )

  if ($Alpha -ge 0.999) {
    $Graphics.DrawImage($Image, $X, $Y, $Width, $Height)
    return
  }

  $matrix = New-Object System.Drawing.Imaging.ColorMatrix
  $matrix.Matrix33 = $Alpha
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  try {
    $attributes.SetColorMatrix($matrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)
    $dest = New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)
    $Graphics.DrawImage($Image, $dest, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
  } finally {
    $attributes.Dispose()
  }
}

function Add-Frame {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Frame,
    [int]$DestIndex,
    [int]$FrameWidth,
    [int]$FrameHeight
  )
  Draw-ImageAlpha $Graphics $Frame ($DestIndex * $FrameWidth) 0 $FrameWidth $FrameHeight 1.0
}

function Add-TweenFrame {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$A,
    [System.Drawing.Bitmap]$B,
    [int]$DestIndex,
    [int]$FrameWidth,
    [int]$FrameHeight,
    [int]$DriftX = 0
  )

  $x = $DestIndex * $FrameWidth
  Draw-ImageAlpha $Graphics $A $x 0 $FrameWidth $FrameHeight 0.74
  Draw-ImageAlpha $Graphics $B ($x + $DriftX) 0 $FrameWidth $FrameHeight 0.46
}

function Set-Quality {
  param([System.Drawing.Graphics]$Graphics)
  $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
}

function Remove-PlayerFrameArtifacts {
  param(
    [System.Drawing.Bitmap]$Frame,
    [int]$SourceIndex
  )

  for ($y = 0; $y -lt $Frame.Height; $y++) {
    for ($x = 0; $x -lt $Frame.Width; $x++) {
      $p = $Frame.GetPixel($x, $y)
      if ($p.A -le 0) { continue }
      $r = [int]$p.R
      $g = [int]$p.G
      $b = [int]$p.B
      $maxRb = [Math]::Max($r, $b)

      $greenFringe = $g -gt 54 -and ($g - $maxRb) -gt 10
      $bottomChroma = $y -gt ($Frame.Height - 18) -and $greenFringe
      $masonryStep = $SourceIndex -eq 10 -and (($x -gt 74 -and $y -gt 116) -or ($x -gt 54 -and $y -gt 145))

      if ($masonryStep -or ($greenFringe -and ($g - $maxRb) -gt 24) -or $bottomChroma) {
        $Frame.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } elseif ($greenFringe) {
        $Frame.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $r, [Math]::Min($g, $maxRb + 8), $b))
      }
    }
  }
}

function Build-PlayerSheet {
  $fw = 128
  $fh = 184
  $source = [System.Drawing.Bitmap]::FromFile($PlayerSource)
  $frames = @()
  $out = New-TransparentBitmap ($fw * 48) $fh
  $graphics = [System.Drawing.Graphics]::FromImage($out)

  try {
    Set-Quality $graphics
    for ($i = 0; $i -lt 24; $i++) {
      $frame = Get-Frame $source $i $fw $fh
      Remove-PlayerFrameArtifacts $frame $i
      $frames += $frame
    }

    Add-Frame $graphics $frames[0] 0 $fw $fh
    Add-TweenFrame $graphics $frames[0] $frames[1] 1 $fw $fh 0

    $walk = @(1, 2, 3, 4, 5, 6, 7, 8)
    for ($i = 0; $i -lt $walk.Count; $i++) {
      $dest = 2 + ($i * 2)
      $current = $walk[$i]
      $next = $walk[($i + 1) % $walk.Count]
      Add-Frame $graphics $frames[$current] $dest $fw $fh
      Add-TweenFrame $graphics $frames[$current] $frames[$next] ($dest + 1) $fw $fh $(if ($i % 2 -eq 0) { 1 } else { -1 })
    }

    Add-Frame $graphics $frames[9] 18 $fw $fh
    Add-TweenFrame $graphics $frames[9] $frames[10] 19 $fw $fh 0
    Add-Frame $graphics $frames[10] 20 $fw $fh
    Add-TweenFrame $graphics $frames[10] $frames[9] 21 $fw $fh 0

    Add-Frame $graphics $frames[11] 22 $fw $fh
    Add-TweenFrame $graphics $frames[11] $frames[11] 23 $fw $fh 0

    $attack = @(12, 13, 14, 15, 16, 17)
    for ($i = 0; $i -lt $attack.Count; $i++) {
      $dest = 24 + ($i * 2)
      $current = $attack[$i]
      $next = if ($i -lt $attack.Count - 1) { $attack[$i + 1] } else { $attack[$i] }
      Add-Frame $graphics $frames[$current] $dest $fw $fh
      Add-TweenFrame $graphics $frames[$current] $frames[$next] ($dest + 1) $fw $fh $(if ($i % 2 -eq 0) { 1 } else { -1 })
    }

    $crouch = @(18, 19, 20, 21, 22, 23)
    for ($i = 0; $i -lt $crouch.Count; $i++) {
      $dest = 36 + ($i * 2)
      $current = $crouch[$i]
      $next = if ($i -lt $crouch.Count - 1) { $crouch[$i + 1] } else { $current }
      Add-Frame $graphics $frames[$current] $dest $fw $fh
      Add-TweenFrame $graphics $frames[$current] $frames[$next] ($dest + 1) $fw $fh 0
    }

    $out.Save($PlayerOut, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    foreach ($frame in $frames) { $frame.Dispose() }
    $out.Dispose()
    $source.Dispose()
  }
}

function Build-WhipSheet {
  $fw = 192
  $fh = 72
  $source = [System.Drawing.Bitmap]::FromFile($WhipSource)
  $frames = @()
  $out = New-TransparentBitmap ($fw * 16) $fh
  $graphics = [System.Drawing.Graphics]::FromImage($out)

  try {
    Set-Quality $graphics
    for ($i = 0; $i -lt 8; $i++) {
      $frames += Get-Frame $source $i $fw $fh
    }

    for ($i = 0; $i -lt 8; $i++) {
      $dest = $i * 2
      $next = if ($i -lt 7) { $i + 1 } else { $i }
      Add-Frame $graphics $frames[$i] $dest $fw $fh
      Add-TweenFrame $graphics $frames[$i] $frames[$next] ($dest + 1) $fw $fh $(if ($i % 2 -eq 0) { 2 } else { -1 })
    }

    $out.Save($WhipOut, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    foreach ($frame in $frames) { $frame.Dispose() }
    $out.Dispose()
    $source.Dispose()
  }
}

Build-PlayerSheet
Build-WhipSheet
Write-Output "Wrote assets/generated/player_sheet_imagen_hd_48.png and assets/generated/whip_sheet_imagen_hd_16.png"
