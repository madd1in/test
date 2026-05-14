Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SourceDir = Join-Path $Root "assets\source"
$SpriteDir = Join-Path $Root "assets\sprites"
$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb
$PngFormat = [System.Drawing.Imaging.ImageFormat]::Png

function Convert-ChromaSheet {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [int]$Cols,
    [int]$Rows,
    [int]$CellMargin = 0
  )

  if (!(Test-Path $InputPath)) {
    throw "Missing source image $InputPath"
  }

  $source = [System.Drawing.Bitmap]::FromFile($InputPath)
  $target = New-Object System.Drawing.Bitmap($source.Width, $source.Height, $PixelFormat)
  $target.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    for ($row = 0; $row -lt $Rows; $row += 1) {
      for ($col = 0; $col -lt $Cols; $col += 1) {
        $x0 = [int][Math]::Round(($source.Width * $col) / [double]$Cols)
        $x1 = [int][Math]::Round(($source.Width * ($col + 1)) / [double]$Cols)
        $y0 = [int][Math]::Round(($source.Height * $row) / [double]$Rows)
        $y1 = [int][Math]::Round(($source.Height * ($row + 1)) / [double]$Rows)
        $sx = $x0 + $CellMargin
        $sy = $y0 + $CellMargin
        $sw = [Math]::Max(1, ($x1 - $x0) - ($CellMargin * 2))
        $sh = [Math]::Max(1, ($y1 - $y0) - ($CellMargin * 2))
        $srcRect = New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)
        $destRect = New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)
        $graphics.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
      }
    }
  } finally {
    $graphics.Dispose()
    $source.Dispose()
  }

  $rect = New-Object System.Drawing.Rectangle(0, 0, $target.Width, $target.Height)
  $data = $target.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $PixelFormat)
  try {
    $bytes = New-Object byte[] ($data.Stride * $data.Height)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

    for ($y = 0; $y -lt $target.Height; $y += 1) {
      $rowOffset = $y * $data.Stride
      for ($x = 0; $x -lt $target.Width; $x += 1) {
        $i = $rowOffset + ($x * 4)
        $b = [int]$bytes[$i]
        $g = [int]$bytes[$i + 1]
        $r = [int]$bytes[$i + 2]
        $a = [int]$bytes[$i + 3]
        if ($a -eq 0) { continue }

        $greenKey = ($g -gt 150 -and $r -lt 92 -and $b -lt 92 -and ($g - [Math]::Max($r, $b)) -gt 86)
        if ($greenKey) {
          $bytes[$i] = 0
          $bytes[$i + 1] = 0
          $bytes[$i + 2] = 0
          $bytes[$i + 3] = 0
        }
      }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  } finally {
    $target.UnlockBits($data)
  }

  $target.Save($OutputPath, $PngFormat)
  $target.Dispose()
  Write-Host "Wrote $OutputPath"
}

New-Item -ItemType Directory -Force -Path $SpriteDir | Out-Null

Convert-ChromaSheet `
  -InputPath (Join-Path $SourceDir "observatory_props_imagen_hd_raw.png") `
  -OutputPath (Join-Path $SpriteDir "observatory_imagen_props_hd_sheet.png") `
  -Cols 4 `
  -Rows 2 `
  -CellMargin 0

Convert-ChromaSheet `
  -InputPath (Join-Path $SourceDir "mini_games_imagen_hd_raw.png") `
  -OutputPath (Join-Path $SpriteDir "mini_games_imagen_hd_sheet.png") `
  -Cols 4 `
  -Rows 2 `
  -CellMargin 3
