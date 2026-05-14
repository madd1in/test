Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SpriteDir = Join-Path $Root "assets\sprites"
$BackgroundDir = Join-Path $Root "assets\backgrounds"
$OutSheet = Join-Path $SpriteDir "interactive_props_sheet.png"

$PixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb
$PngFormat = [System.Drawing.Imaging.ImageFormat]::Png
$Cell = 512
$Cols = 4
$Rows = 2

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

function Add-ShapeToPath {
  param(
    [System.Drawing.Drawing2D.GraphicsPath]$Path,
    [hashtable]$Prop,
    [hashtable]$Shape,
    [float]$ScaleX,
    [float]$ScaleY
  )

  $kind = if ($Shape.ContainsKey("Kind")) { $Shape.Kind } else { "polygon" }

  if ($kind -eq "ellipse") {
    $ellipse = $Shape.Ellipse
    $Path.AddEllipse(
      (($ellipse[0] - $Prop.X) * $ScaleX),
      (($ellipse[1] - $Prop.Y) * $ScaleY),
      ($ellipse[2] * $ScaleX),
      ($ellipse[3] * $ScaleY)
    )
    return
  }

  $points = @()
  foreach ($point in $Shape.Points) {
    $points += New-Object System.Drawing.PointF(
      (($point[0] - $Prop.X) * $ScaleX),
      (($point[1] - $Prop.Y) * $ScaleY)
    )
  }

  if ($kind -eq "curve") {
    $Path.AddClosedCurve([System.Drawing.PointF[]]$points, 0.42)
  } else {
    $Path.AddPolygon([System.Drawing.PointF[]]$points)
  }
}

function New-PropPath {
  param(
    [hashtable]$Prop,
    [float]$ScaleX,
    [float]$ScaleY
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath

  if ($Prop.ContainsKey("Shapes")) {
    foreach ($shape in $Prop.Shapes) {
      Add-ShapeToPath $path $Prop $shape $ScaleX $ScaleY
    }
  } else {
    Add-ShapeToPath $path $Prop $Prop $ScaleX $ScaleY
  }
  return $path
}

function Copy-Prop {
  param(
    [System.Drawing.Bitmap]$Sheet,
    [hashtable]$Prop
  )

  $backgroundPath = Join-Path $BackgroundDir $Prop.Source
  if (!(Test-Path $backgroundPath)) {
    throw "Missing background $backgroundPath"
  }

  $source = [System.Drawing.Bitmap]::FromFile($backgroundPath)
  $cellBmp = New-Bitmap $Cell $Cell
  $cellG = New-Graphics $cellBmp
  try {
    $scaleX = $Cell / [float]$Prop.W
    $scaleY = $Cell / [float]$Prop.H
    $clipPath = New-PropPath $Prop $scaleX $scaleY
    $cellG.SetClip($clipPath)
    $src = New-Object System.Drawing.Rectangle($Prop.X, $Prop.Y, $Prop.W, $Prop.H)
    $dest = New-Object System.Drawing.Rectangle(0, 0, $Cell, $Cell)
    $cellG.DrawImage($source, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
    $clipPath.Dispose()
  } finally {
    $cellG.Dispose()
    $source.Dispose()
  }

  $sheetG = [System.Drawing.Graphics]::FromImage($Sheet)
  try {
    $sheetG.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $sheetG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $destX = $Prop.Col * $Cell
    $destY = $Prop.Row * $Cell
    $sheetG.DrawImage($cellBmp, $destX, $destY, $Cell, $Cell)
  } finally {
    $sheetG.Dispose()
    $cellBmp.Dispose()
  }
}

function Build-Props {
  New-Item -ItemType Directory -Force -Path $SpriteDir | Out-Null

  $props = @(
    @{
      Source = "observatory_imagen_hd.png"; Col = 0; Row = 0; X = 748; Y = 304; W = 510; H = 455;
      Shapes = @(
        @{
          Kind = "polygon";
          Points = @(
            @(812, 334), @(888, 308), @(1232, 550), @(1196, 612), @(805, 404), @(762, 372)
          )
        },
        @{
          Kind = "polygon";
          Points = @( @(960, 548), @(1008, 548), @(1016, 724), @(954, 724) )
        },
        @{
          Kind = "polygon";
          Points = @( @(986, 546), @(1030, 560), @(1130, 738), @(1080, 746) )
        },
        @{
          Kind = "polygon";
          Points = @( @(968, 548), @(934, 560), @(858, 732), @(810, 722) )
        },
        @{
          Kind = "ellipse";
          Ellipse = @(930, 506, 118, 88)
        }
      )
    },
    @{
      Source = "observatory_imagen_hd.png"; Col = 1; Row = 0; X = 560; Y = 408; W = 340; H = 330; Kind = "polygon";
      Points = @(
        @(612, 452), @(834, 432), @(848, 650), @(630, 674), @(592, 522)
      )
    },
    @{
      Source = "observatory_imagen_hd.png"; Col = 2; Row = 0; X = 1138; Y = 300; W = 210; H = 150; Kind = "curve";
      Points = @(
        @(1162, 388), @(1218, 324), @(1310, 342), @(1325, 398), @(1240, 430), @(1160, 416)
      )
    },
    @{
      Source = "observatory_imagen_hd.png"; Col = 3; Row = 0; X = 1304; Y = 350; W = 245; H = 220; Kind = "curve";
      Points = @(
        @(1330, 404), @(1485, 378), @(1530, 438), @(1512, 526), @(1360, 560), @(1318, 500)
      )
    },
    @{
      Source = "observatory_imagen_hd.png"; Col = 0; Row = 1; X = 260; Y = 740; W = 570; H = 285; Kind = "ellipse";
      Ellipse = @(286, 790, 500, 215)
    },
    @{
      Source = "observatory_imagen_hd.png"; Col = 1; Row = 1; X = 1218; Y = 292; W = 286; H = 510; Kind = "curve";
      Points = @(
        @(1270, 324), @(1434, 318), @(1460, 710), @(1362, 782), @(1242, 696), @(1228, 486)
      )
    },
    @{
      Source = "harbor_imagen_hd.png"; Col = 2; Row = 1; X = 1268; Y = 584; W = 652; H = 312; Kind = "curve";
      Points = @(
        @(1298, 692), @(1410, 636), @(1585, 620), @(1818, 654), @(1910, 725), @(1850, 820),
        @(1668, 862), @(1435, 838), @(1288, 760)
      )
    }
  )

  $sheet = New-Bitmap ($Cols * $Cell) ($Rows * $Cell)
  try {
    foreach ($prop in $props) {
      Copy-Prop $sheet $prop
    }
    $sheet.Save($OutSheet, $PngFormat)
  } finally {
    $sheet.Dispose()
  }

  Write-Host "Wrote $OutSheet"
}

Build-Props
