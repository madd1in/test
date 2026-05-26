$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")
$source = Join-Path $root "assets\imagen-hd\imagen-gameplay-ui-source.png"
$outDir = Join-Path $root "assets\hd"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

if (-not (Test-Path $source)) {
  throw "Missing Imagen gameplay source: $source"
}

function Color-Hex([string] $hex, [int] $alpha = 255) {
  $clean = $hex.TrimStart("#")
  $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b)
}

function New-Canvas([int] $w, [int] $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return @{ Bitmap = $bmp; Graphics = $g }
}

function New-RoundedPath([float] $x, [float] $y, [float] $w, [float] $h, [float] $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = [Math]::Min($r, [Math]::Min($w / 2, $h / 2))
  $d = $radius * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-Png($bmp, [string] $name) {
  $bmp.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-FontFamily([string[]] $names) {
  foreach ($name in $names) {
    try {
      return New-Object System.Drawing.FontFamily($name)
    } catch {
    }
  }
  return [System.Drawing.FontFamily]::GenericSansSerif
}

function Draw-TextureClip($g, $src, $path, [System.Drawing.RectangleF] $dest, [System.Drawing.Rectangle] $crop, [float] $alpha) {
  $state = $g.Save()
  $attrs = New-Object System.Drawing.Imaging.ImageAttributes
  $matrix = New-Object System.Drawing.Imaging.ColorMatrix
  $matrix.Matrix33 = $alpha
  $attrs.SetColorMatrix($matrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)
  try {
    $g.SetClip($path)
    $g.DrawImage($src, [System.Drawing.Rectangle]::Round($dest), $crop.X, $crop.Y, $crop.Width, $crop.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
  } finally {
    $g.Restore($state)
    $attrs.Dispose()
  }
}

function Draw-Gloss($g, [float] $x, [float] $y, [float] $w, [float] $h, [float] $angle) {
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(150, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
    $angle
  )
  $path = New-RoundedPath $x $y $w $h ($h / 2)
  try {
    $g.FillPath($brush, $path)
  } finally {
    $brush.Dispose()
    $path.Dispose()
  }
}

function Draw-TextPath($g, [string] $text, [System.Drawing.RectangleF] $rect, [float] $size, [System.Drawing.FontFamily] $family, [System.Drawing.Color] $top, [System.Drawing.Color] $bottom, [float] $stroke) {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddString($text, $family, [int][System.Drawing.FontStyle]::Bold, $size, $rect, $format)
  $shadowMatrix = New-Object System.Drawing.Drawing2D.Matrix
  $shadowMatrix.Translate(7, 10)
  $shadow = $path.Clone()
  $shadow.Transform($shadowMatrix)
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(135, 0, 0, 0))
  $strokeWidth = [single]($stroke + 6)
  $edgeWidth = [single]$stroke
  $strokePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(205, 2, 10, 20), $strokeWidth)
  $edgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 238, 248, 255), $edgeWidth)
  $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $top, $bottom, 90)
  try {
    $g.FillPath($shadowBrush, $shadow)
    $g.DrawPath($strokePen, $path)
    $g.FillPath($fill, $path)
    $g.DrawPath($edgePen, $path)
  } finally {
    $fill.Dispose()
    $edgePen.Dispose()
    $strokePen.Dispose()
    $shadowBrush.Dispose()
    $shadow.Dispose()
    $shadowMatrix.Dispose()
    $path.Dispose()
    $format.Dispose()
  }
}

$palette = @(
  @{ Main = "#f85f77"; Dark = "#7e1831"; Light = "#ffd6df"; Glow = "#ff87a0"; Accent = "#2de2d1" },
  @{ Main = "#48dacd"; Dark = "#116678"; Light = "#d4fffb"; Glow = "#70fff0"; Accent = "#ffd166" },
  @{ Main = "#ffd166"; Dark = "#936115"; Light = "#fff0ae"; Glow = "#ffe08c"; Accent = "#a98cff" },
  @{ Main = "#a98cff"; Dark = "#46348f"; Light = "#e5dcff"; Glow = "#cbbcff"; Accent = "#ff6f91" }
)

$titleFamily = New-FontFamily @("Arial Black", "Bahnschrift", "Segoe UI Black", "Impact")
$buttonFamily = New-FontFamily @("Arial Black", "Segoe UI Black", "Bahnschrift", "Impact")
$src = [System.Drawing.Image]::FromFile($source)

try {
  # Imagen-treated reagent tube / bottle frame.
  $canvas = New-Canvas 1200 1700
  $bmp = $canvas.Bitmap
  $g = $canvas.Graphics
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $body = New-RoundedPath 158 170 884 1378 116
    $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF(158, 170, 884, 1378)),
      [System.Drawing.Color]::FromArgb(28, 188, 245, 255),
      [System.Drawing.Color]::FromArgb(7, 53, 225, 209),
      92
    )
    $g.FillPath($fill, $body)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 231, 253, 255), 18)), $body)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 57, 228, 232), 44)), $body)

    $inner = New-RoundedPath 232 244 736 1212 92
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(46, 255, 255, 255), 9)), $inner)
    $inner.Dispose()

    $rim = New-RoundedPath 350 50 500 210 72
    $rimFill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF(350, 50, 500, 210)),
      [System.Drawing.Color]::FromArgb(132, 220, 254, 255),
      [System.Drawing.Color]::FromArgb(24, 57, 225, 209),
      92
    )
    $g.FillPath($rimFill, $rim)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 245, 255, 255), 18)), $rim)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 21, 48, 76), 36)), $rim)

    $liquid = New-RoundedPath 238 1110 724 336 82
    $liquidBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF(238, 1110, 724, 336)),
      [System.Drawing.Color]::FromArgb(18, 83, 225, 209),
      [System.Drawing.Color]::FromArgb(26, 255, 209, 102),
      0
    )
    $g.FillPath($liquidBrush, $liquid)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(76, 255, 255, 255), 5)), $liquid)
    $liquid.Dispose()
    $liquidBrush.Dispose()

    for ($i = 0; $i -lt 16; $i += 1) {
      $bubbleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(46, 238, 248, 255))
      $bx = 292 + (($i * 97) % 560)
      $by = 336 + (($i * 151) % 1060)
      $bs = 12 + (($i * 7) % 20)
      $g.FillEllipse($bubbleBrush, $bx, $by, $bs, $bs)
      $bubbleBrush.Dispose()
    }

    $shinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(154, 255, 255, 255), 12)
    $shinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($shinePen, 276, 276, 276, 1358)
    $g.DrawLine($shinePen, 372, 118, 782, 118)
    $g.DrawBezier($shinePen, 880, 294, 986, 580, 948, 980, 886, 1310)
    $shinePen.Dispose()
    $rimFill.Dispose()
    $rim.Dispose()
    $fill.Dispose()
    $body.Dispose()
    Save-Png $bmp "imagen-vial-frame-hd.png"
  } finally {
    $g.Dispose()
    $bmp.Dispose()
  }

  function Draw-CapsuleFrame($g, [int] $baseX, [int] $baseY, $entry, [int] $frame, $src) {
    $state = $g.Save()
    $cx = $baseX + 128
    $cy = $baseY + 128 + [Math]::Sin($frame * [Math]::PI / 2) * 4
    $rot = -10 + $frame * 5
    $scaleX = 1 + [Math]::Sin($frame * [Math]::PI / 2) * 0.035
    $scaleY = 1 - [Math]::Sin($frame * [Math]::PI / 2) * 0.025
    try {
      $g.TranslateTransform($cx, $cy)
      $g.RotateTransform($rot)
      $g.ScaleTransform($scaleX, $scaleY)
      $shadow = New-RoundedPath -94 48 188 38 19
      $g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(66, 0, 0, 0))), $shadow)
      $shadow.Dispose()
      $path = New-RoundedPath -96 -54 192 108 54
      $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.RectangleF(-96, -54, 192, 108)),
        (Color-Hex $entry.Light),
        (Color-Hex $entry.Dark),
        36
      )
      $g.FillPath($fill, $path)
      Draw-TextureClip $g $src $path (New-Object System.Drawing.RectangleF(-96, -54, 192, 108)) (New-Object System.Drawing.Rectangle(420, 92, 620, 360)) 0.18
      $accentBrush = New-Object System.Drawing.SolidBrush((Color-Hex $entry.Accent 120))
      $g.FillRectangle($accentBrush, -8, -48, 16, 96)
      $accentBrush.Dispose()
      $g.DrawPath((New-Object System.Drawing.Pen((Color-Hex $entry.Glow 220), 5)), $path)
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(170, 255, 255, 255), 3)), $path)
      Draw-Gloss $g -66 -38 92 26 18
      $path.Dispose()
      $fill.Dispose()
    } finally {
      $g.Restore($state)
    }
  }

  $canvas = New-Canvas 4096 256
  $bmp = $canvas.Bitmap
  $g = $canvas.Graphics
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    for ($i = 0; $i -lt 4; $i += 1) {
      for ($frame = 0; $frame -lt 4; $frame += 1) {
        Draw-CapsuleFrame $g (($i * 4 + $frame) * 256) 0 $palette[$i] $frame $src
      }
    }
    Save-Png $bmp "imagen-pill-anim-atlas-hd.png"
  } finally {
    $g.Dispose()
    $bmp.Dispose()
  }

  function Draw-VirusFrame($g, [int] $baseX, [int] $baseY, $entry, [int] $frame, $src) {
    $cx = $baseX + 128
    $cy = $baseY + 128 + [Math]::Sin($frame * [Math]::PI / 2) * 5
    $squash = 1 + [Math]::Sin($frame * [Math]::PI / 2) * 0.08
    $spikeBrush = New-Object System.Drawing.SolidBrush((Color-Hex $entry.Dark 244))
    $spikeHighlight = New-Object System.Drawing.SolidBrush((Color-Hex $entry.Light 190))
    try {
      for ($s = 0; $s -lt 14; $s += 1) {
        $angle = ($s / 14.0) * [Math]::PI * 2 + $frame * 0.18
        $distX = 76 + (($s % 3) * 5)
        $distY = 62 + (($s % 2) * 7)
        $sx = $cx + [Math]::Cos($angle) * $distX
        $sy = $cy + [Math]::Sin($angle) * ($distY / $squash)
        $g.FillEllipse($spikeBrush, [float]($sx - 15), [float]($sy - 15), 30, 30)
        $g.FillEllipse($spikeHighlight, [float]($sx - 7), [float]($sy - 9), 10, 9)
      }
    } finally {
      $spikeBrush.Dispose()
      $spikeHighlight.Dispose()
    }
    $body = New-RoundedPath ($baseX + 42) ($baseY + 42 + (($cy - $baseY - 128) / 2)) 172 (170 / $squash) 64
    $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF(($baseX + 42), ($baseY + 42), 172, 170)),
      (Color-Hex $entry.Light),
      (Color-Hex $entry.Dark),
      48
    )
    try {
      $g.FillPath($fill, $body)
      Draw-TextureClip $g $src $body (New-Object System.Drawing.RectangleF(($baseX + 42), ($baseY + 42), 172, 170)) (New-Object System.Drawing.Rectangle(165, 440, 660, 470)) 0.16
      $g.DrawPath((New-Object System.Drawing.Pen((Color-Hex $entry.Glow 220), 5)), $body)
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(145, 255, 255, 255), 3)), $body)
      $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 3, 13, 26))
      $shineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
      $blink = if ($frame -eq 2) { 12 } else { 38 }
      $eyeY = $baseY + 98 + (38 - $blink) / 2
      $g.FillEllipse($eyeBrush, $baseX + 82 + $frame, $eyeY, 31, $blink)
      $g.FillEllipse($eyeBrush, $baseX + 142 + $frame, $eyeY, 31, $blink)
      if ($blink -gt 20) {
        $g.FillEllipse($shineBrush, $baseX + 93 + $frame, $baseY + 107, 8, 10)
        $g.FillEllipse($shineBrush, $baseX + 153 + $frame, $baseY + 107, 8, 10)
      }
      $mouthPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 3, 13, 26), 8)
      $mouthPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
      $mouthPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
      $g.DrawArc($mouthPen, $baseX + 92, $baseY + 144 + ($frame % 2) * 3, 72, 38, 16, 148)
      $tooth = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(224, 255, 255, 255))
      $g.FillPolygon($tooth, @(
        (New-Object System.Drawing.PointF(($baseX + 122), ($baseY + 154))),
        (New-Object System.Drawing.PointF(($baseX + 132), ($baseY + 154))),
        (New-Object System.Drawing.PointF(($baseX + 127), ($baseY + 170)))
      ))
      $tooth.Dispose()
      $mouthPen.Dispose()
      $eyeBrush.Dispose()
      $shineBrush.Dispose()
    } finally {
      $fill.Dispose()
      $body.Dispose()
    }
  }

  $canvas = New-Canvas 4096 256
  $bmp = $canvas.Bitmap
  $g = $canvas.Graphics
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    for ($i = 0; $i -lt 4; $i += 1) {
      for ($frame = 0; $frame -lt 4; $frame += 1) {
        Draw-VirusFrame $g (($i * 4 + $frame) * 256) 0 $palette[$i] $frame $src
      }
    }
    Save-Png $bmp "imagen-virus-anim-atlas-hd.png"
  } finally {
    $g.Dispose()
    $bmp.Dispose()
  }

  function Draw-LogoAsset([string] $name, [int] $w, [int] $h, [float] $size) {
    $canvas = New-Canvas $w $h
    $bmp = $canvas.Bitmap
    $g = $canvas.Graphics
    try {
      $g.Clear([System.Drawing.Color]::Transparent)
      $plate = New-RoundedPath 18 24 ($w - 36) ($h - 48) 34
      $plateFill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.RectangleF(18, 24, ($w - 36), ($h - 48))),
        [System.Drawing.Color]::FromArgb(236, 8, 23, 42),
        [System.Drawing.Color]::FromArgb(226, 19, 57, 82),
        18
      )
      $g.FillPath($plateFill, $plate)
      Draw-TextureClip $g $src $plate (New-Object System.Drawing.RectangleF(18, 24, ($w - 36), ($h - 48))) (New-Object System.Drawing.Rectangle(760, 55, 620, 330)) 0.22
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(185, 83, 225, 209), 5)), $plate)
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 209, 102), 2)), $plate)
      $plateFill.Dispose()
      $plate.Dispose()
      Draw-TextPath $g "CAPSULE CLINIC HD" (New-Object System.Drawing.RectangleF(34, 30, ($w - 68), ($h - 60))) $size $titleFamily (Color-Hex "#f5fbff") (Color-Hex "#ffd166") 3.5
      Save-Png $bmp $name
    } finally {
      $g.Dispose()
      $bmp.Dispose()
    }
  }

  function Draw-ButtonAsset([string] $name, [string] $text, [System.Drawing.Color] $top, [System.Drawing.Color] $bottom) {
    $canvas = New-Canvas 512 192
    $bmp = $canvas.Bitmap
    $g = $canvas.Graphics
    try {
      $g.Clear([System.Drawing.Color]::Transparent)
      $shadow = New-RoundedPath 38 122 436 48 24
      $g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(88, 0, 0, 0))), $shadow)
      $shadow.Dispose()
      $button = New-RoundedPath 28 24 456 124 44
      $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.RectangleF(28, 24, 456, 124)),
        $top,
        $bottom,
        8
      )
      $g.FillPath($fill, $button)
      Draw-TextureClip $g $src $button (New-Object System.Drawing.RectangleF(28, 24, 456, 124)) (New-Object System.Drawing.Rectangle(870, 530, 530, 280)) 0.22
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 238, 248, 255), 5)), $button)
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(158, 255, 255, 255), 2)), $button)
      Draw-Gloss $g 70 44 210 28 10
      $fill.Dispose()
      $button.Dispose()
      Draw-TextPath $g $text (New-Object System.Drawing.RectangleF(52, 30, 408, 116)) 57 $buttonFamily (Color-Hex "#06111f") (Color-Hex "#123148") 2.2
      Save-Png $bmp $name
    } finally {
      $g.Dispose()
      $bmp.Dispose()
    }
  }

  function Draw-StateAsset([string] $name, [string] $text) {
    $canvas = New-Canvas 720 170
    $bmp = $canvas.Bitmap
    $g = $canvas.Graphics
    try {
      $g.Clear([System.Drawing.Color]::Transparent)
      $plate = New-RoundedPath 24 28 672 112 26
      $plateFill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.RectangleF(24, 28, 672, 112)),
        [System.Drawing.Color]::FromArgb(218, 5, 14, 28),
        [System.Drawing.Color]::FromArgb(210, 24, 66, 94),
        0
      )
      $g.FillPath($plateFill, $plate)
      Draw-TextureClip $g $src $plate (New-Object System.Drawing.RectangleF(24, 28, 672, 112)) (New-Object System.Drawing.Rectangle(900, 360, 540, 210)) 0.18
      $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(170, 83, 225, 209), 4)), $plate)
      $plateFill.Dispose()
      $plate.Dispose()
      Draw-TextPath $g $text (New-Object System.Drawing.RectangleF(42, 38, 636, 92)) 48 $titleFamily (Color-Hex "#eef8ff") (Color-Hex "#72fff0") 2
      Save-Png $bmp $name
    } finally {
      $g.Dispose()
      $bmp.Dispose()
    }
  }

  Draw-LogoAsset "imagen-title-logo-hd.png" 1100 320 74
  Draw-LogoAsset "imagen-hud-logo-hd.png" 760 186 48
  Draw-ButtonAsset "imagen-button-start-hd.png" "START" (Color-Hex "#54f0df") (Color-Hex "#ffd166")
  Draw-ButtonAsset "imagen-button-restart-hd.png" "RESTART" (Color-Hex "#ffd166") (Color-Hex "#ff7a92")
  Draw-ButtonAsset "imagen-button-resume-hd.png" "RESUME" (Color-Hex "#9ddcff") (Color-Hex "#a98cff")
  Draw-StateAsset "imagen-overlay-ready-hd.png" "READY"
  Draw-StateAsset "imagen-overlay-paused-hd.png" "PAUSED"
  Draw-StateAsset "imagen-overlay-gameover-hd.png" "GAME OVER"

  $canvas = New-Canvas 320 112
  $bmp = $canvas.Bitmap
  $g = $canvas.Graphics
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $badge = New-RoundedPath 10 18 300 76 18
    $badgeFill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF(10, 18, 300, 76)),
      [System.Drawing.Color]::FromArgb(228, 4, 13, 26),
      [System.Drawing.Color]::FromArgb(210, 31, 68, 94),
      0
    )
    $g.FillPath($badgeFill, $badge)
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 209, 102), 4)), $badge)
    $badgeFill.Dispose()
    $badge.Dispose()
    Draw-TextPath $g "ASSAY" (New-Object System.Drawing.RectangleF(84, 26, 200, 58)) 30 $buttonFamily (Color-Hex "#eef8ff") (Color-Hex "#ffd166") 1.4
    Save-Png $bmp "imagen-assay-badge-hd.png"
  } finally {
    $g.Dispose()
    $bmp.Dispose()
  }

  $canvas = New-Canvas 460 120
  $bmp = $canvas.Bitmap
  $g = $canvas.Graphics
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $panel = New-RoundedPath 8 12 444 96 22
    $panelFill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.RectangleF(8, 12, 444, 96)),
      [System.Drawing.Color]::FromArgb(210, 4, 13, 26),
      [System.Drawing.Color]::FromArgb(196, 24, 62, 89),
      0
    )
    $g.FillPath($panelFill, $panel)
    Draw-TextureClip $g $src $panel (New-Object System.Drawing.RectangleF(8, 12, 444, 96)) (New-Object System.Drawing.Rectangle(730, 300, 640, 190)) 0.12
    $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 238, 248, 255), 3)), $panel)
    $panelFill.Dispose()
    $panel.Dispose()
    Save-Png $bmp "imagen-status-ribbon-hd.png"
  } finally {
    $g.Dispose()
    $bmp.Dispose()
  }

  $manifestPath = Join-Path $outDir "asset-manifest.json"
  if (Test-Path $manifestPath) {
    $manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
    $assetList = @($manifest.assets)
  } else {
    $assetList = @()
  }
  $newAssets = @(
    "imagen-vial-frame-hd.png",
    "imagen-pill-anim-atlas-hd.png",
    "imagen-virus-anim-atlas-hd.png",
    "imagen-title-logo-hd.png",
    "imagen-hud-logo-hd.png",
    "imagen-button-start-hd.png",
    "imagen-button-restart-hd.png",
    "imagen-button-resume-hd.png",
    "imagen-overlay-ready-hd.png",
    "imagen-overlay-paused-hd.png",
    "imagen-overlay-gameover-hd.png",
    "imagen-assay-badge-hd.png",
    "imagen-status-ribbon-hd.png"
  )
  $merged = @($assetList + $newAssets | Select-Object -Unique)
  [ordered]@{
    generated = (Get-Date).ToString("s")
    assets = $merged
    imagenSource = "assets/imagen-hd/imagen-gameplay-ui-source.png"
  } | ConvertTo-Json -Depth 4 | Set-Content -Encoding ASCII -Path $manifestPath
} finally {
  $src.Dispose()
  $titleFamily.Dispose()
  $buttonFamily.Dispose()
}

Write-Host "Created Imagen gameplay, UI, and animation assets."
