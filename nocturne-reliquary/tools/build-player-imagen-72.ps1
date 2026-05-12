Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PlayerAtlasTools {
  public static Rectangle CleanChromaAndBounds(Bitmap frame, out double lowerCenter) {
    lowerCenter = frame.Width / 2.0;
    Rectangle rect = new Rectangle(0, 0, frame.Width, frame.Height);
    BitmapData data = frame.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppPArgb);
    int stride = data.Stride;
    int bytes = Math.Abs(stride) * frame.Height;
    byte[] buffer = new byte[bytes];
    Marshal.Copy(data.Scan0, buffer, 0, bytes);

    int minX = frame.Width;
    int minY = frame.Height;
    int maxX = -1;
    int maxY = -1;
    for (int y = 0; y < frame.Height; y++) {
      int row = y * stride;
      for (int x = 0; x < frame.Width; x++) {
        int i = row + x * 4;
        byte b = buffer[i + 0];
        byte g = buffer[i + 1];
        byte r = buffer[i + 2];
        byte a = buffer[i + 3];
        if (a == 0) continue;
        int maxRb = Math.Max(r, b);
        int maxRgb = Math.Max(r, Math.Max(g, b));
        int minRgb = Math.Min(r, Math.Min(g, b));
        bool nearEdge = x < 2 || x > frame.Width - 3 || y < 2 || y > frame.Height - 3;
        bool hardOuterEdge = x < 2 || x > frame.Width - 3 || y < 1 || y > frame.Height - 2;
        bool greenKey = g > 120 && (g - maxRb) > 42;
        bool neutralGrid = r > 145 && g > 145 && b > 145 && (maxRgb - minRgb) < 68;
        bool edgeGrid = hardOuterEdge || neutralGrid || (nearEdge && ((g > 135 && (r + b) < 320) || (r > 170 && g > 170 && b > 170)));

        if (greenKey || edgeGrid) {
          buffer[i + 0] = 0;
          buffer[i + 1] = 0;
          buffer[i + 2] = 0;
          buffer[i + 3] = 0;
          continue;
        }

        if (g > 70 && (g - maxRb) > 12) {
          buffer[i + 1] = (byte)Math.Min(g, maxRb + 8);
        }

        if (buffer[i + 3] > 8) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX >= 0) {
      int lowerStart = Math.Max(0, maxY - 72);
      int lowerMinX = frame.Width;
      int lowerMaxX = -1;
      for (int y = lowerStart; y <= maxY; y++) {
        int row = y * stride;
        for (int x = 0; x < frame.Width; x++) {
          int i = row + x * 4;
          if (buffer[i + 3] <= 8) continue;
          if (x < lowerMinX) lowerMinX = x;
          if (x > lowerMaxX) lowerMaxX = x;
        }
      }
      lowerCenter = lowerMaxX >= 0 ? (lowerMinX + lowerMaxX) / 2.0 : (minX + maxX) / 2.0;
    }

    Marshal.Copy(buffer, 0, data.Scan0, bytes);
    frame.UnlockBits(data);
    if (maxX < 0) return Rectangle.Empty;
    return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
  }
}
"@

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Generated = Join-Path $Root "assets\generated"
$SourcePath = Join-Path $Generated "player_sheet_imagen_hd_72_source.png"
$OutPath = Join-Path $Generated "player_sheet_imagen_hd_72.png"

$FrameWidth = 128
$FrameHeight = 184
$Columns = 12
$Rows = 6
$FrameCount = $Columns * $Rows
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

function Set-Quality {
  param([System.Drawing.Graphics]$Graphics)
  $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
}

function Build-Frame {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Index
  )

  $col = $Index % $Columns
  $row = [Math]::Floor($Index / $Columns)
  $x1 = [Math]::Floor(($col * $Source.Width) / $Columns) + 3
  $x2 = [Math]::Floor((($col + 1) * $Source.Width) / $Columns) - 3
  $y1 = [Math]::Floor(($row * $Source.Height) / $Rows) + 3
  $y2 = [Math]::Floor((($row + 1) * $Source.Height) / $Rows) - 3
  $sourceRect = New-Object System.Drawing.Rectangle($x1, $y1, [Math]::Max(1, $x2 - $x1), [Math]::Max(1, $y2 - $y1))
  $frame = New-TransparentBitmap $FrameWidth $FrameHeight
  $g = [System.Drawing.Graphics]::FromImage($frame)
  try {
    Set-Quality $g
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $FrameWidth, $FrameHeight)
    $g.DrawImage($Source, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $g.Dispose()
  }

  $lowerCenter = 0.0
  $bounds = [PlayerAtlasTools]::CleanChromaAndBounds($frame, [ref]$lowerCenter)
  if ($bounds.IsEmpty) { return $frame }

  $targetBottom = $FrameHeight - 3
  $dx = [int][Math]::Round(($FrameWidth / 2) - $lowerCenter)
  $dy = [int][Math]::Round($targetBottom - $bounds.Bottom)
  if ([Math]::Abs($dx) -le 1 -and [Math]::Abs($dy) -le 1) { return $frame }

  $aligned = New-TransparentBitmap $FrameWidth $FrameHeight
  $alignGraphics = [System.Drawing.Graphics]::FromImage($aligned)
  try {
    Set-Quality $alignGraphics
    $alignGraphics.DrawImage($frame, $dx, $dy, $FrameWidth, $FrameHeight)
  } finally {
    $alignGraphics.Dispose()
    $frame.Dispose()
  }
  return $aligned
}

if (!(Test-Path $SourcePath)) {
  throw "Missing source atlas: $SourcePath"
}

$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
$out = New-TransparentBitmap ($FrameWidth * $FrameCount) $FrameHeight
$graphics = [System.Drawing.Graphics]::FromImage($out)

try {
  Set-Quality $graphics
  for ($i = 0; $i -lt $FrameCount; $i++) {
    $frame = Build-Frame $source $i
    try {
      $graphics.DrawImage($frame, $i * $FrameWidth, 0, $FrameWidth, $FrameHeight)
    } finally {
      $frame.Dispose()
    }
  }
  $out.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $out.Dispose()
  $source.Dispose()
}

Write-Output "Wrote assets/generated/player_sheet_imagen_hd_72.png from assets/generated/player_sheet_imagen_hd_72_source.png"
