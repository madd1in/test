Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PlayerAtlasTools {
  private struct Component {
    public int Area;
    public int MinX;
    public int MinY;
    public int MaxX;
    public int MaxY;
  }

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
        bool greenKey = g > 120 && (g - maxRb) > 42;
        bool neutralGrid = r > 145 && g > 145 && b > 145 && (maxRgb - minRgb) < 68;
        bool edgeGrid = neutralGrid || (nearEdge && ((g > 135 && (r + b) < 320) || (r > 170 && g > 170 && b > 170)));

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

  public static Rectangle KeepPrimaryComponents(Bitmap frame, int keepPad, double targetCenterX, out double lowerCenter) {
    lowerCenter = frame.Width / 2.0;
    Rectangle rect = new Rectangle(0, 0, frame.Width, frame.Height);
    BitmapData data = frame.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppPArgb);
    int stride = data.Stride;
    int bytes = Math.Abs(stride) * frame.Height;
    byte[] buffer = new byte[bytes];
    Marshal.Copy(data.Scan0, buffer, 0, bytes);

    int pixelCount = frame.Width * frame.Height;
    bool[] visited = new bool[pixelCount];
    int[] labels = new int[pixelCount];
    for (int i = 0; i < labels.Length; i++) labels[i] = -1;
    List<Component> components = new List<Component>();
    int[] queue = new int[pixelCount];

    for (int y = 0; y < frame.Height; y++) {
      for (int x = 0; x < frame.Width; x++) {
        int start = y * frame.Width + x;
        if (visited[start]) continue;
        visited[start] = true;
        int bi = y * stride + x * 4;
        if (buffer[bi + 3] <= 8) continue;

        int compIndex = components.Count;
        int head = 0;
        int tail = 0;
        queue[tail++] = start;
        labels[start] = compIndex;
        Component comp = new Component {
          Area = 0,
          MinX = x,
          MinY = y,
          MaxX = x,
          MaxY = y
        };

        while (head < tail) {
          int p = queue[head++];
          int px = p % frame.Width;
          int py = p / frame.Width;
          comp.Area++;
          if (px < comp.MinX) comp.MinX = px;
          if (py < comp.MinY) comp.MinY = py;
          if (px > comp.MaxX) comp.MaxX = px;
          if (py > comp.MaxY) comp.MaxY = py;

          for (int n = 0; n < 4; n++) {
            int nx = px + (n == 0 ? 1 : n == 1 ? -1 : 0);
            int ny = py + (n == 2 ? 1 : n == 3 ? -1 : 0);
            if (nx < 0 || nx >= frame.Width || ny < 0 || ny >= frame.Height) continue;
            int np = ny * frame.Width + nx;
            if (visited[np]) continue;
            visited[np] = true;
            int ni = ny * stride + nx * 4;
            if (buffer[ni + 3] <= 8) continue;
            labels[np] = compIndex;
            queue[tail++] = np;
          }
        }

        components.Add(comp);
      }
    }

    if (components.Count == 0) {
      frame.UnlockBits(data);
      return Rectangle.Empty;
    }

    int primaryIndex = 0;
    double bestScore = double.MinValue;
    for (int i = 0; i < components.Count; i++) {
      Component c = components[i];
      int cw = c.MaxX - c.MinX + 1;
      int ch = c.MaxY - c.MinY + 1;
      double centerPenalty = Math.Abs(((c.MinX + c.MaxX) / 2.0) - targetCenterX) * 85.0;
      double score = c.Area + ch * 22 + cw * 4 - centerPenalty;
      if (score > bestScore) {
        bestScore = score;
        primaryIndex = i;
      }
    }

    Component primary = components[primaryIndex];
    bool[] keep = new bool[components.Count];
    for (int i = 0; i < components.Count; i++) {
      Component c = components[i];
      int dx = c.MinX > primary.MaxX ? c.MinX - primary.MaxX : primary.MinX > c.MaxX ? primary.MinX - c.MaxX : 0;
      int dy = c.MinY > primary.MaxY ? c.MinY - primary.MaxY : primary.MinY > c.MaxY ? primary.MinY - c.MaxY : 0;
      keep[i] = i == primaryIndex || (dx <= keepPad && dy <= keepPad);
    }

    int minX = frame.Width;
    int minY = frame.Height;
    int maxX = -1;
    int maxY = -1;
    for (int y = 0; y < frame.Height; y++) {
      int row = y * stride;
      for (int x = 0; x < frame.Width; x++) {
        int p = y * frame.Width + x;
        int i = row + x * 4;
        int label = labels[p];
        if (label < 0 || !keep[label]) {
          buffer[i + 0] = 0;
          buffer[i + 1] = 0;
          buffer[i + 2] = 0;
          buffer[i + 3] = 0;
          continue;
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

  public static void RemoveFrameGuideArtifacts(Bitmap frame) {
    Rectangle rect = new Rectangle(0, 0, frame.Width, frame.Height);
    BitmapData data = frame.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppPArgb);
    int stride = data.Stride;
    int bytes = Math.Abs(stride) * frame.Height;
    byte[] buffer = new byte[bytes];
    Marshal.Copy(data.Scan0, buffer, 0, bytes);

    for (int y = 0; y < frame.Height; y++) {
      int row = y * stride;
      for (int x = 0; x < frame.Width; x++) {
        int i = row + x * 4;
        byte b = buffer[i + 0];
        byte g = buffer[i + 1];
        byte r = buffer[i + 2];
        byte a = buffer[i + 3];
        if (a <= 8) continue;
        int ia = a;
        int ur = Math.Min(255, (r * 255) / Math.Max(1, ia));
        int ug = Math.Min(255, (g * 255) / Math.Max(1, ia));
        int ub = Math.Min(255, (b * 255) / Math.Max(1, ia));
        int maxRgb = Math.Max(ur, Math.Max(ug, ub));
        int minRgb = Math.Min(ur, Math.Min(ug, ub));
        bool paleCyanGuide = ur > 145 && ug > 190 && ub > 185 && (maxRgb - minRgb) < 88;
        bool greenEdge = ug > 70 && (ug - Math.Max(ur, ub)) > 12;
        if (paleCyanGuide || greenEdge) {
          buffer[i + 0] = 0;
          buffer[i + 1] = 0;
          buffer[i + 2] = 0;
          buffer[i + 3] = 0;
        }
      }
    }

    Marshal.Copy(buffer, 0, data.Scan0, bytes);
    frame.UnlockBits(data);
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
$SourceInset = 1
$SourcePadX = 54
$SourcePadY = 10
$MaxContentWidth = 116.0
$MaxContentHeight = 176.0
$BaseScale = 1.18
$FramePadX = 6
$FramePadTop = 4
$TargetBottom = $FrameHeight - 4

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
  $slotX1 = [Math]::Floor(($col * $Source.Width) / $Columns)
  $slotX2 = [Math]::Floor((($col + 1) * $Source.Width) / $Columns)
  $slotY1 = [Math]::Floor(($row * $Source.Height) / $Rows)
  $slotY2 = [Math]::Floor((($row + 1) * $Source.Height) / $Rows)
  $x1 = [Math]::Max(0, $slotX1 - $SourcePadX) + $SourceInset
  $x2 = [Math]::Min($Source.Width, $slotX2 + $SourcePadX) - $SourceInset
  $y1 = [Math]::Max(0, $slotY1 - $SourcePadY) + $SourceInset
  $y2 = [Math]::Min($Source.Height, $slotY2 + $SourcePadY) - $SourceInset
  $targetCenterX = (($slotX1 + $slotX2) / 2.0) - $x1
  $sourceRect = New-Object System.Drawing.Rectangle($x1, $y1, [Math]::Max(1, $x2 - $x1), [Math]::Max(1, $y2 - $y1))
  $raw = New-TransparentBitmap $sourceRect.Width $sourceRect.Height
  $g = [System.Drawing.Graphics]::FromImage($raw)
  try {
    Set-Quality $g
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $sourceRect.Width, $sourceRect.Height)
    $g.DrawImage($Source, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $g.Dispose()
  }

  $lowerCenter = 0.0
  $bounds = [PlayerAtlasTools]::CleanChromaAndBounds($raw, [ref]$lowerCenter)
  if ($bounds.IsEmpty) { return (New-TransparentBitmap $FrameWidth $FrameHeight) }
  $bounds = [PlayerAtlasTools]::KeepPrimaryComponents($raw, 6, $targetCenterX, [ref]$lowerCenter)
  if ($bounds.IsEmpty) { return (New-TransparentBitmap $FrameWidth $FrameHeight) }

  $fitScale = [Math]::Min($MaxContentWidth / $bounds.Width, $MaxContentHeight / $bounds.Height)
  $scale = [Math]::Min($BaseScale, $fitScale)
  $destW = [Math]::Max(1, [int][Math]::Round($bounds.Width * $scale))
  $destH = [Math]::Max(1, [int][Math]::Round($bounds.Height * $scale))
  $anchorX = ($lowerCenter - $bounds.Left) * $scale
  $destX = [int][Math]::Round(($FrameWidth / 2.0) - $anchorX)
  $destY = [int][Math]::Round($TargetBottom - $destH)
  if ($destX -lt $FramePadX) { $destX = $FramePadX }
  if ($destX + $destW -gt $FrameWidth - $FramePadX) { $destX = $FrameWidth - $FramePadX - $destW }
  if ($destY -lt $FramePadTop) { $destY = $FramePadTop }
  if ($destY + $destH -gt $TargetBottom) { $destY = $TargetBottom - $destH }

  $frame = New-TransparentBitmap $FrameWidth $FrameHeight
  $frameGraphics = [System.Drawing.Graphics]::FromImage($frame)
  try {
    Set-Quality $frameGraphics
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    $frameGraphics.DrawImage($raw, $destRect, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $frameGraphics.Dispose()
    $raw.Dispose()
  }
  [PlayerAtlasTools]::RemoveFrameGuideArtifacts($frame)
  return $frame
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
