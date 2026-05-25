$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")
$source = Join-Path $root "assets\imagen-hd\imagen-lab-background-source.png"
$outDir = Join-Path $root "assets\hd"

if (-not (Test-Path $source)) {
  throw "Missing Imagen background source: $source"
}

function New-Canvas([int] $w, [int] $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @{ Bitmap = $bmp; Graphics = $g }
}

$src = [System.Drawing.Image]::FromFile($source)
try {
  $bg = New-Canvas 1920 1080
  try {
    $srcRatio = $src.Width / $src.Height
    $dstRatio = 1920 / 1080
    if ($srcRatio -gt $dstRatio) {
      $cropH = $src.Height
      $cropW = [int]($cropH * $dstRatio)
      $cropX = [int](($src.Width - $cropW) / 2)
      $cropY = 0
    } else {
      $cropW = $src.Width
      $cropH = [int]($cropW / $dstRatio)
      $cropX = 0
      $cropY = [int](($src.Height - $cropH) * 0.36)
    }
    $bg.Graphics.DrawImage(
      $src,
      (New-Object System.Drawing.Rectangle(0, 0, 1920, 1080)),
      $cropX,
      $cropY,
      $cropW,
      $cropH,
      [System.Drawing.GraphicsUnit]::Pixel
    )
    $bgPng = Join-Path $outDir "background-lab-imagen-hd.png"
    $bgJpg = Join-Path $outDir "background-lab-imagen-hd.jpg"
    $bg.Bitmap.Save($bgPng, [System.Drawing.Imaging.ImageFormat]::Png)
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $jpegParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    try {
      $jpegParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 88L)
      $bg.Bitmap.Save($bgJpg, $jpegCodec, $jpegParams)
    } finally {
      $jpegParams.Dispose()
    }
  } finally {
    $bg.Graphics.Dispose()
    $bg.Bitmap.Dispose()
  }

  $atlas = New-Canvas 1024 512
  try {
    $crops = @(
      @(0, 80, 360, 500),
      @([int]($src.Width - 360), 80, 360, 500),
      @(360, 270, 260, 260),
      @([int]($src.Width - 620), 270, 260, 260),
      @(0, 620, 420, 300),
      @([int]($src.Width - 420), 620, 420, 300),
      @(420, 120, 300, 190),
      @([int]($src.Width - 720), 120, 300, 190)
    )
    for ($i = 0; $i -lt $crops.Count; $i += 1) {
      $crop = $crops[$i]
      $dx = ($i % 4) * 256
      $dy = [Math]::Floor($i / 4) * 256
      $atlas.Graphics.DrawImage(
        $src,
        (New-Object System.Drawing.Rectangle($dx, $dy, 256, 256)),
        $crop[0],
        $crop[1],
        $crop[2],
        $crop[3],
        [System.Drawing.GraphicsUnit]::Pixel
      )
    }
    $atlas.Bitmap.Save((Join-Path $outDir "background-prop-atlas-hd.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $atlas.Graphics.Dispose()
    $atlas.Bitmap.Dispose()
  }
} finally {
  $src.Dispose()
}

Write-Host "Created Imagen background assets."
