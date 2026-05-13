param(
  [switch]$BackgroundsOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SourceAtlas = Join-Path $Root "assets\source\background_atlas_imagen_hd.png"
$SingleBackgroundDir = Join-Path $Root "assets\source\backgrounds_single"
$ItemSource = Join-Path $Root "assets\source\item_atlas_imagen_hd.png"
$BackgroundDir = Join-Path $Root "assets\backgrounds"
$SpriteDir = Join-Path $Root "assets\sprites"

New-Item -ItemType Directory -Force -Path $BackgroundDir, $SpriteDir | Out-Null

$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb
$PngFormat = [System.Drawing.Imaging.ImageFormat]::Png

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
  return $graphics
}

function New-SolidBrush {
  param([int]$A, [int]$R, [int]$G, [int]$B)
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($A, $R, $G, $B))
}

function New-PenColor {
  param([int]$A, [int]$R, [int]$G, [int]$B, [float]$Width = 1)
  return New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($A, $R, $G, $B), $Width)
}

function Save-Png {
  param([System.Drawing.Bitmap]$Bitmap, [string]$Path)
  $Bitmap.Save($Path, $PngFormat)
  Write-Host "Wrote $Path"
}

function Get-CoverRect {
  param([int]$X, [int]$Y, [int]$Width, [int]$Height, [double]$TargetAspect)
  $aspect = $Width / [double]$Height
  if ($aspect -gt $TargetAspect) {
    $newWidth = [int][Math]::Round($Height * $TargetAspect)
    $cropX = $X + [int](($Width - $newWidth) / 2)
    return New-Object System.Drawing.Rectangle($cropX, $Y, $newWidth, $Height)
  }
  $newHeight = [int][Math]::Round($Width / $TargetAspect)
  $cropY = $Y + [int](($Height - $newHeight) / 2)
  return New-Object System.Drawing.Rectangle($X, $cropY, $Width, $newHeight)
}

function Add-BackgroundGrade {
  param([System.Drawing.Graphics]$G, [string]$Scene)

  $topColor = [System.Drawing.Color]::FromArgb(42, 17, 29, 45)
  $bottomColor = [System.Drawing.Color]::FromArgb(68, 2, 5, 9)
  if ($Scene -eq "tavern") {
    $topColor = [System.Drawing.Color]::FromArgb(24, 90, 41, 18)
    $bottomColor = [System.Drawing.Color]::FromArgb(74, 31, 10, 8)
  } elseif ($Scene -eq "jungle") {
    $topColor = [System.Drawing.Color]::FromArgb(22, 24, 74, 45)
    $bottomColor = [System.Drawing.Color]::FromArgb(58, 5, 32, 24)
  } elseif ($Scene -eq "beach") {
    $topColor = [System.Drawing.Color]::FromArgb(24, 35, 61, 82)
    $bottomColor = [System.Drawing.Color]::FromArgb(62, 12, 10, 16)
  }

  $rect = New-Object System.Drawing.Rectangle(0, 0, 1920, 1080)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $topColor, $bottomColor, 90)
  try {
    $G.FillRectangle($brush, $rect)
  } finally {
    $brush.Dispose()
  }

  $vignette = New-SolidBrush 78 0 0 0
  try {
    $G.FillRectangle($vignette, 0, 0, 1920, 88)
    $G.FillRectangle($vignette, 0, 992, 1920, 88)
    $G.FillRectangle($vignette, 0, 0, 96, 1080)
    $G.FillRectangle($vignette, 1824, 0, 96, 1080)
  } finally {
    $vignette.Dispose()
  }
}

function Add-ForegroundHints {
  param([System.Drawing.Graphics]$G, [string]$Scene)

  $shadow = New-SolidBrush 60 0 0 0
  try {
    if ($Scene -eq "harbor") {
      $G.FillEllipse($shadow, 344, 795, 312, 34)
    } elseif ($Scene -eq "tavern") {
      $G.FillEllipse($shadow, 710, 792, 370, 42)
    } elseif ($Scene -eq "jungle") {
      $G.FillEllipse($shadow, 420, 810, 470, 46)
    } else {
      $G.FillEllipse($shadow, 915, 815, 440, 42)
    }
  } finally {
    $shadow.Dispose()
  }
}

function Build-Backgrounds {
  $singleSources = @{
    harbor = Join-Path $SingleBackgroundDir "harbor_single_imagen_hd.png"
    tavern = Join-Path $SingleBackgroundDir "tavern_single_imagen_hd.png"
    jungle = Join-Path $SingleBackgroundDir "jungle_single_imagen_hd.png"
    beach = Join-Path $SingleBackgroundDir "beach_single_imagen_hd.png"
  }

  if (@($singleSources.Values | Where-Object { !(Test-Path $_) }).Count -eq 0) {
    foreach ($entry in $singleSources.GetEnumerator()) {
      $scene = $entry.Key
      $source = [System.Drawing.Bitmap]::FromFile($entry.Value)
      $bitmap = New-Bitmap 1920 1080
      $graphics = New-Graphics $bitmap
      try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(255, 12, 16, 20))
        $src = Get-CoverRect 0 0 $source.Width $source.Height (16.0 / 9.0)
        $dest = New-Object System.Drawing.Rectangle(0, 0, 1920, 1080)
        $graphics.DrawImage($source, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
        $source.Dispose()
      }
      Save-Png $bitmap (Join-Path $BackgroundDir "$scene`_imagen_hd.png")
      $bitmap.Dispose()
    }
    return
  }

  if (!(Test-Path $SourceAtlas)) {
    throw "Missing source atlas $SourceAtlas"
  }

  $atlas = [System.Drawing.Bitmap]::FromFile($SourceAtlas)
  try {
    $halfW = [int]($atlas.Width / 2)
    $halfH = [int]($atlas.Height / 2)
    $panels = @(
      @{ Name = "harbor"; X = 0; Y = 0 },
      @{ Name = "tavern"; X = $halfW; Y = 0 },
      @{ Name = "jungle"; X = 0; Y = $halfH },
      @{ Name = "beach"; X = $halfW; Y = $halfH }
    )

    foreach ($panel in $panels) {
      $bitmap = New-Bitmap 1920 1080
      $graphics = New-Graphics $bitmap
      try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(255, 12, 16, 20))
        $src = Get-CoverRect $panel.X $panel.Y $halfW $halfH (16.0 / 9.0)
        $dest = New-Object System.Drawing.Rectangle(0, 0, 1920, 1080)
        $graphics.DrawImage($atlas, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
        Add-BackgroundGrade $graphics $panel.Name
        Add-ForegroundHints $graphics $panel.Name
      } finally {
        $graphics.Dispose()
      }
      Save-Png $bitmap (Join-Path $BackgroundDir "$($panel.Name)_imagen_hd.png")
      $bitmap.Dispose()
    }
  } finally {
    $atlas.Dispose()
  }
}

function Draw-BodyPath {
  param(
    [System.Drawing.Graphics]$G,
    [float]$Cx,
    [float]$Cy,
    [float]$Scale,
    [int]$Facing,
    [float]$Phase,
    [string]$Mode,
    [string]$Palette
  )

  $skin = New-SolidBrush 255 188 118 74
  $skinLight = New-SolidBrush 255 239 173 111
  $coat = New-SolidBrush 255 28 76 103
  $coatDark = New-SolidBrush 255 14 43 61
  $sash = New-SolidBrush 255 220 78 66
  $shirt = New-SolidBrush 255 245 224 172
  $boot = New-SolidBrush 255 42 27 24
  $hat = New-SolidBrush 255 32 25 31
  $hatTrim = New-SolidBrush 255 230 183 78
  $hair = New-SolidBrush 255 64 32 23
  $outline = New-PenColor 190 8 11 15 2.8
  if ($Palette -eq "dockmaster") {
    $coat.Dispose(); $coatDark.Dispose(); $sash.Dispose(); $hat.Dispose()
    $coat = New-SolidBrush 255 103 74 38
    $coatDark = New-SolidBrush 255 53 38 25
    $sash = New-SolidBrush 255 40 129 121
    $hat = New-SolidBrush 255 83 49 34
  } elseif ($Palette -eq "barkeep") {
    $coat.Dispose(); $coatDark.Dispose(); $sash.Dispose(); $hat.Dispose()
    $coat = New-SolidBrush 255 118 44 54
    $coatDark = New-SolidBrush 255 62 25 34
    $sash = New-SolidBrush 255 236 155 59
    $hat = New-SolidBrush 255 62 33 28
  } elseif ($Palette -eq "keeper") {
    $coat.Dispose(); $coatDark.Dispose(); $sash.Dispose(); $hat.Dispose()
    $coat = New-SolidBrush 255 42 116 76
    $coatDark = New-SolidBrush 255 19 58 44
    $sash = New-SolidBrush 255 217 188 95
    $hat = New-SolidBrush 255 33 62 49
  }

  $old = $G.Transform
  $G.TranslateTransform($Cx, $Cy)
  $G.ScaleTransform($Scale * $Facing, $Scale)

  try {
    $bob = [Math]::Sin($Phase) * 3.0
    $step = [Math]::Sin($Phase)
    $step2 = [Math]::Sin($Phase + [Math]::PI)
    $talk = if ($Mode -eq "talk") { [Math]::Abs([Math]::Sin($Phase * 2.0)) } else { 0.0 }
    $reach = if ($Mode -eq "use") { [Math]::Sin([Math]::Min([Math]::PI, $Phase % [Math]::PI)) } else { 0.0 }
    $duck = if ($Mode -eq "pickup") { [Math]::Abs([Math]::Sin($Phase * 0.5)) * 26.0 } else { 0.0 }
    $legSwing = if ($Mode -like "walk*") { 18.0 } else { 4.0 }

    $shadow = New-SolidBrush 64 0 0 0
    $G.FillEllipse($shadow, -54, -18, 108, 20)
    $shadow.Dispose()

    $bodyY = -112 + $bob + $duck
    $headY = -178 + $bob + ($duck * 0.55)

    $leftLeg = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leftLeg.AddPolygon([System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF -26, ($bodyY + 78)),
      (New-Object System.Drawing.PointF -7, ($bodyY + 80)),
      (New-Object System.Drawing.PointF ($step * $legSwing + 0), -22),
      (New-Object System.Drawing.PointF ($step * $legSwing - 22), -21)
    ))
    $rightLeg = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rightLeg.AddPolygon([System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF 8, ($bodyY + 80)),
      (New-Object System.Drawing.PointF 28, ($bodyY + 78)),
      (New-Object System.Drawing.PointF ($step2 * $legSwing + 21), -21),
      (New-Object System.Drawing.PointF ($step2 * $legSwing + 0), -22)
    ))
    $G.FillPath($boot, $leftLeg)
    $G.DrawPath($outline, $leftLeg)
    $G.FillPath($boot, $rightLeg)
    $G.DrawPath($outline, $rightLeg)
    $leftLeg.Dispose()
    $rightLeg.Dispose()

    $coatPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $coatPath.AddPolygon([System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF -48, ($bodyY - 52)),
      (New-Object System.Drawing.PointF 43, ($bodyY - 54)),
      (New-Object System.Drawing.PointF 54, ($bodyY + 68)),
      (New-Object System.Drawing.PointF 17, ($bodyY + 90)),
      (New-Object System.Drawing.PointF -45, ($bodyY + 72))
    ))
    $G.FillPath($coatDark, $coatPath)
    $G.DrawPath($outline, $coatPath)
    $coatPath.Dispose()
    $G.FillEllipse($coat, -43, ($bodyY - 63), 86, 124)
    $G.DrawEllipse($outline, -43, ($bodyY - 63), 86, 124)
    $G.FillRectangle($shirt, -18, ($bodyY - 48), 34, 77)
    $G.FillRectangle($sash, -37, ($bodyY + 12), 78, 18)

    $armSwing = if ($Mode -like "walk*") { [Math]::Sin($Phase + 0.7) * 18.0 } else { 0.0 }
    $rightHandX = 57 + ($reach * 42.0)
    $rightHandY = $bodyY - 14 - ($reach * 42.0) + ($talk * 7.0)
    $leftHandX = -53
    $leftHandY = $bodyY - 4 + $armSwing
    $armPen = New-PenColor 255 188 118 74 15
    $sleevePen = New-PenColor 255 28 76 103 17
    if ($Palette -eq "dockmaster") {
      $sleevePen.Dispose(); $sleevePen = New-PenColor 255 103 74 38 17
    } elseif ($Palette -eq "barkeep") {
      $sleevePen.Dispose(); $sleevePen = New-PenColor 255 118 44 54 17
    } elseif ($Palette -eq "keeper") {
      $sleevePen.Dispose(); $sleevePen = New-PenColor 255 42 116 76 17
    }
    $G.DrawLine($sleevePen, -35, ($bodyY - 38), $leftHandX, $leftHandY)
    $G.DrawLine($armPen, $leftHandX, $leftHandY, ($leftHandX - 3), ($leftHandY + 21))
    $G.DrawLine($sleevePen, 33, ($bodyY - 38), $rightHandX, $rightHandY)
    $G.DrawLine($armPen, $rightHandX, $rightHandY, ($rightHandX + 3), ($rightHandY + 22))
    $armPen.Dispose()
    $sleevePen.Dispose()

    if ($Mode -eq "use") {
      $sparkPen = New-PenColor 220 255 220 116 2.2
      $G.DrawLine($sparkPen, ($rightHandX + 18), ($rightHandY + 7), ($rightHandX + 46), ($rightHandY - 18))
      $G.DrawLine($sparkPen, ($rightHandX + 23), ($rightHandY - 18), ($rightHandX + 49), ($rightHandY + 9))
      $sparkPen.Dispose()
    }

    $G.FillEllipse($hair, -34, ($headY - 16), 68, 73)
    $G.FillEllipse($skin, -30, $headY, 60, 64)
    $G.FillEllipse($skinLight, -10, ($headY + 12), 31, 24)
    $G.DrawEllipse($outline, -30, $headY, 60, 64)
    $eye = New-SolidBrush 255 12 15 18
    $G.FillEllipse($eye, 8, ($headY + 25), 6, 6)
    $G.FillEllipse($eye, -13, ($headY + 25), 6, 6)
    $eye.Dispose()
    $mouthPen = New-PenColor 210 89 34 32 2.4
    if ($talk -gt 0.35) {
      $G.DrawEllipse($mouthPen, -6, ($headY + 43), 16, (4 + $talk * 10))
    } else {
      $G.DrawArc($mouthPen, -8, ($headY + 39), 20, 14, 20, 142)
    }
    $mouthPen.Dispose()

    $hatPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hatPath.AddPolygon([System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF -55, ($headY + 4)),
      (New-Object System.Drawing.PointF -17, ($headY - 28)),
      (New-Object System.Drawing.PointF 46, ($headY - 20)),
      (New-Object System.Drawing.PointF 58, ($headY + 6)),
      (New-Object System.Drawing.PointF 9, ($headY + 1))
    ))
    $G.FillPath($hat, $hatPath)
    $G.DrawPath($outline, $hatPath)
    $hatPath.Dispose()
    $trimPen = New-PenColor 255 230 183 78 3.0
    $G.DrawLine($trimPen, -39, ($headY + 2), 46, ($headY + 2))
    $trimPen.Dispose()
  } finally {
    $G.Transform = $old
    $old.Dispose()
    foreach ($obj in @($skin, $skinLight, $coat, $coatDark, $sash, $shirt, $boot, $hat, $hatTrim, $hair, $outline)) {
      $obj.Dispose()
    }
  }
}

function Draw-Frame {
  param(
    [System.Drawing.Graphics]$G,
    [int]$Row,
    [int]$Frame,
    [string]$Mode,
    [int]$Facing,
    [string]$Palette
  )
  $frameW = 192
  $frameH = 256
  $x = ($Frame * $frameW) + ($frameW / 2)
  $y = ($Row * $frameH) + 238
  $phase = ($Frame / 16.0) * [Math]::PI * 2.0
  if ($Mode -eq "idle") { $phase = ($Frame / 12.0) * [Math]::PI * 2.0 }
  if ($Mode -eq "talk") { $phase = ($Frame / 12.0) * [Math]::PI * 2.0 }
  if ($Mode -eq "pickup") { $phase = ($Frame / 10.0) * [Math]::PI * 2.0 }
  Draw-BodyPath $G $x $y 0.88 $Facing $phase $Mode $Palette
}

function Build-CharacterSheet {
  $cols = 16
  $rows = 10
  $frameW = 192
  $frameH = 256
  $sheet = New-Bitmap ($cols * $frameW) ($rows * $frameH)
  $graphics = New-Graphics $sheet
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    for ($i = 0; $i -lt 16; $i += 1) {
      Draw-Frame $graphics 0 $i "idle" 1 "player"
      Draw-Frame $graphics 1 $i "walk" 1 "player"
      Draw-Frame $graphics 2 $i "walk" -1 "player"
      Draw-Frame $graphics 3 $i "talk" 1 "player"
      Draw-Frame $graphics 4 $i "pickup" 1 "player"
      Draw-Frame $graphics 5 $i "use" 1 "player"
      Draw-Frame $graphics 6 $i "idle" -1 "dockmaster"
      Draw-Frame $graphics 7 $i "talk" -1 "barkeep"
      Draw-Frame $graphics 8 $i "talk" 1 "keeper"
      Draw-Frame $graphics 9 $i "idle" 1 "keeper"
    }
  } finally {
    $graphics.Dispose()
  }
  Save-Png $sheet (Join-Path $SpriteDir "characters_imagen_hd_sheet.png")
  $sheet.Dispose()
}

function Draw-IconLabel {
  param([System.Drawing.Graphics]$G, [string]$Text, [int]$X, [int]$Y)
  $font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
  $brush = New-SolidBrush 210 255 244 210
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  try {
    $rect = New-Object System.Drawing.RectangleF($X, ($Y + 75), 96, 18)
    $G.DrawString($Text, $font, $brush, $rect, $format)
  } finally {
    $font.Dispose()
    $brush.Dispose()
    $format.Dispose()
  }
}

function Build-ItemSheet {
  if (Test-Path $ItemSource) {
    $source = [System.Drawing.Bitmap]::FromFile($ItemSource)
    $target = New-Bitmap 2048 1024
    $g = New-Graphics $target
    try {
      $g.Clear([System.Drawing.Color]::Transparent)
      $dest = New-Object System.Drawing.Rectangle(0, 0, 2048, 1024)
      $src = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
      $g.DrawImage($source, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
    } finally {
      $g.Dispose()
      $source.Dispose()
    }
    Save-Png $target (Join-Path $SpriteDir "items_imagen_hd_sheet.png")
    $target.Dispose()
    return
  }

  $cols = 8
  $rows = 2
  $size = 96
  $sheet = New-Bitmap ($cols * $size) ($rows * $size)
  $g = New-Graphics $sheet
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $outline = New-PenColor 190 15 12 12 3
    $gold = New-SolidBrush 255 236 181 72
    $rope = New-PenColor 255 196 146 84 8
    $lime = New-SolidBrush 255 115 196 76
    $shell = New-SolidBrush 255 238 207 160
    $paper = New-SolidBrush 255 225 205 156
    $blue = New-SolidBrush 255 58 167 203
    for ($i = 0; $i -lt 12; $i += 1) {
      $x = ($i % $cols) * $size
      $y = [Math]::Floor($i / $cols) * $size
      $glow = New-SolidBrush 54 255 225 155
      $g.FillEllipse($glow, ($x + 8), ($y + 8), 80, 80)
      $glow.Dispose()
      switch ($i) {
        0 {
          $g.DrawEllipse($rope, ($x + 20), ($y + 18), 56, 44)
          $g.DrawArc($rope, ($x + 30), ($y + 36), 40, 34, 185, 210)
          Draw-IconLabel $g "ROPE" $x $y
        }
        1 {
          $g.FillEllipse($gold, ($x + 24), ($y + 22), 48, 48)
          $g.DrawEllipse($outline, ($x + 24), ($y + 22), 48, 48)
          Draw-IconLabel $g "TOKEN" $x $y
        }
        2 {
          $g.FillEllipse($lime, ($x + 28), ($y + 24), 42, 36)
          $g.DrawArc($outline, ($x + 28), ($y + 24), 42, 36, 10, 260)
          Draw-IconLabel $g "LIME" $x $y
        }
        3 {
          $g.FillEllipse($shell, ($x + 18), ($y + 23), 58, 43)
          $g.DrawArc($outline, ($x + 18), ($y + 23), 58, 43, 190, 230)
          $g.DrawLine($outline, ($x + 47), ($y + 25), ($x + 47), ($y + 65))
          Draw-IconLabel $g "KEY" $x $y
        }
        4 {
          $g.FillRectangle($paper, ($x + 19), ($y + 23), 58, 42)
          $g.DrawRectangle($outline, ($x + 19), ($y + 23), 58, 42)
          $g.DrawLine($outline, ($x + 28), ($y + 36), ($x + 67), ($y + 36))
          $g.DrawLine($outline, ($x + 28), ($y + 48), ($x + 59), ($y + 48))
          Draw-IconLabel $g "NOTE" $x $y
        }
        5 {
          $g.FillEllipse($blue, ($x + 24), ($y + 20), 48, 48)
          $g.DrawEllipse($outline, ($x + 24), ($y + 20), 48, 48)
          $g.DrawLine((New-PenColor 255 255 234 132 4), ($x + 48), ($y + 12), ($x + 48), ($y + 76))
          Draw-IconLabel $g "STAR" $x $y
        }
        6 {
          $g.FillPolygon($gold, [System.Drawing.Point[]]@(
            (New-Object System.Drawing.Point ($x + 48), ($y + 18)),
            (New-Object System.Drawing.Point ($x + 66), ($y + 58)),
            (New-Object System.Drawing.Point ($x + 26), ($y + 58))
          ))
          $g.DrawPolygon($outline, [System.Drawing.Point[]]@(
            (New-Object System.Drawing.Point ($x + 48), ($y + 18)),
            (New-Object System.Drawing.Point ($x + 66), ($y + 58)),
            (New-Object System.Drawing.Point ($x + 26), ($y + 58))
          ))
          Draw-IconLabel $g "IDOL" $x $y
        }
        default {
          $g.FillEllipse($paper, ($x + 30), ($y + 28), 36, 36)
          $g.DrawEllipse($outline, ($x + 30), ($y + 28), 36, 36)
        }
      }
    }
    foreach ($obj in @($outline, $gold, $rope, $lime, $shell, $paper, $blue)) {
      $obj.Dispose()
    }
  } finally {
    $g.Dispose()
  }
  Save-Png $sheet (Join-Path $SpriteDir "items_imagen_hd_sheet.png")
  $sheet.Dispose()
}

function Build-SceneItemSheet {
  $sourcePath = Join-Path $SpriteDir "items_imagen_hd_sheet.png"
  if (!(Test-Path $sourcePath)) {
    return
  }

  $source = [System.Drawing.Bitmap]::FromFile($sourcePath)
  $target = New-Bitmap $source.Width $source.Height
  $g = New-Graphics $target
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
    $g.DrawImage($source, $srcRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $g.Dispose()
    $source.Dispose()
  }

  $rect = New-Object System.Drawing.Rectangle(0, 0, $target.Width, $target.Height)
  $data = $target.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $PixelFormat)
  try {
    $bytes = New-Object byte[] ($data.Stride * $data.Height)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    $cellW = [int]($target.Width / 4)
    $cellH = [int]($target.Height / 2)
    for ($y = 0; $y -lt $target.Height; $y += 1) {
      $row = $y * $data.Stride
      $localY = $y % $cellH
      for ($x = 0; $x -lt $target.Width; $x += 1) {
        $i = $row + ($x * 4)
        $b = [int]$bytes[$i]
        $gch = [int]$bytes[$i + 1]
        $r = [int]$bytes[$i + 2]
        $a = [int]$bytes[$i + 3]
        if ($a -le 0) {
          continue
        }

        $localX = $x % $cellW
        $cellEdge = ($localX -lt 10 -or $localY -lt 10 -or ($cellW - $localX) -lt 10 -or ($cellH - $localY) -lt 10)
        $nearBlack = ($r -lt 18 -and $gch -lt 24 -and $b -lt 26)
        $darkTeal = ($r -lt 76 -and $gch -gt 22 -and $b -gt 20 -and $gch -ge ($r + 8) -and $b -ge ($r + 2) -and [Math]::Abs($gch - $b) -lt 52)
        $smokeTeal = ($r -lt 48 -and $gch -lt 92 -and $b -lt 92 -and $gch -gt $r -and $b -ge ($r - 4))
        if ($cellEdge -or $nearBlack -or $darkTeal -or $smokeTeal) {
          $bytes[$i] = 0
          $bytes[$i + 1] = 0
          $bytes[$i + 2] = 0
          $bytes[$i + 3] = 0
        } elseif ($a -gt 0) {
          $bytes[$i + 3] = 255
        }
      }
    }
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  } finally {
    $target.UnlockBits($data)
  }

  Save-Png $target (Join-Path $SpriteDir "scene_items_imagen_hd_sheet.png")
  $target.Dispose()
}

Build-Backgrounds
if ($BackgroundsOnly) {
  return
}
Build-CharacterSheet
if ((Test-Path (Join-Path $Root "assets\source\player_anim_atlas_imagen_key.png")) -and (Test-Path (Join-Path $Root "assets\source\npc_anim_atlas_imagen_key.png"))) {
  & (Join-Path $PSScriptRoot "build_imagen_character_sprites.ps1")
}
Build-ItemSheet
Build-SceneItemSheet
