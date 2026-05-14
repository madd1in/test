Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SourceSheet = Join-Path $Root "assets\sprites\npcs_market_observatory_imagen_sheet.png"
$OutSheet = Join-Path $Root "assets\sprites\npcs_market_observatory_normalized_sheet.png"
$SourceMirror = Join-Path $Root "assets\source\npcs_market_observatory_normalized_sheet_source.png"

$NormalizerCode = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ExtraNpcSheetNormalizer
{
  const int FrameW = 192;
  const int FrameH = 256;
  const int AlphaThreshold = 18;
  const int MinComponentArea = 18;
  const int Pad = 3;
  const int SideMargin = 2;
  const int TopMargin = 8;
  const int BottomMargin = 8;

  sealed class SpriteComponent
  {
    public readonly List<int> Pixels = new List<int>();
    public int MinX = Int32.MaxValue;
    public int MinY = Int32.MaxValue;
    public int MaxX = -1;
    public int MaxY = -1;
    public long SumX = 0;
    public int Area = 0;

    public double CenterX
    {
      get { return Area == 0 ? 0.0 : (double)SumX / (double)Area; }
    }

    public void Add(int index, int x, int y)
    {
      Pixels.Add(index);
      Area++;
      SumX += x;
      if (x < MinX) MinX = x;
      if (x > MaxX) MaxX = x;
      if (y < MinY) MinY = y;
      if (y > MaxY) MaxY = y;
    }
  }

  sealed class SlotBuild
  {
    public List<SpriteComponent> Components;
    public int CropX;
    public int CropY;
    public int CropW;
    public int CropH;
    public bool HasSprite;
  }

  public static void Normalize(string sourcePath, string outputPath, string mirrorPath)
  {
    using (Bitmap source = new Bitmap(sourcePath))
    {
      if (source.Width % FrameW != 0 || source.Height % FrameH != 0)
      {
        throw new InvalidOperationException("NPC sheet dimensions must be multiples of 192x256.");
      }

      Rectangle fullRect = new Rectangle(0, 0, source.Width, source.Height);
      BitmapData sourceData = source.LockBits(fullRect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      int sourceStride = sourceData.Stride;
      byte[] sourceBytes = new byte[Math.Abs(sourceStride) * source.Height];
      Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);
      source.UnlockBits(sourceData);

      using (Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
      using (Graphics graphics = Graphics.FromImage(output))
      {
        graphics.Clear(Color.Transparent);
        graphics.CompositingMode = CompositingMode.SourceOver;
        graphics.CompositingQuality = CompositingQuality.HighQuality;
        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
        graphics.SmoothingMode = SmoothingMode.HighQuality;

        int cols = source.Width / FrameW;
        int rows = source.Height / FrameH;
        SlotBuild[,] builds = new SlotBuild[rows, cols];
        double[] groupScales = new double[(rows + 1) / 2];
        for (int i = 0; i < groupScales.Length; i++)
        {
          groupScales[i] = 1.0;
        }

        for (int row = 0; row < rows; row++)
        {
          List<SpriteComponent>[] slots = new List<SpriteComponent>[cols];
          for (int col = 0; col < cols; col++)
          {
            slots[col] = new List<SpriteComponent>();
          }

          List<SpriteComponent> components = FindRowComponents(sourceBytes, sourceStride, source.Width, row * FrameH);
          int maxArea = 0;
          for (int i = 0; i < components.Count; i++)
          {
            if (components[i].Area > maxArea)
            {
              maxArea = components[i].Area;
            }
          }

          int mainThreshold = Math.Max(5000, maxArea / 4);
          List<SpriteComponent> mainComponents = new List<SpriteComponent>();
          for (int i = 0; i < components.Count; i++)
          {
            SpriteComponent component = components[i];
            if (component.Area >= mainThreshold)
            {
              mainComponents.Add(component);
            }
          }
          mainComponents.Sort(delegate(SpriteComponent a, SpriteComponent b) {
            return a.CenterX.CompareTo(b.CenterX);
          });

          for (int i = 0; i < mainComponents.Count && i < cols; i++)
          {
            slots[i].Add(mainComponents[i]);
          }

          for (int i = 0; i < components.Count; i++)
          {
            SpriteComponent component = components[i];
            if (component.Area < MinComponentArea || mainComponents.Contains(component))
            {
              continue;
            }
            if (component.MaxY < 16 && component.Area < 600)
            {
              continue;
            }

            int nearest = FindNearestMain(component, mainComponents);
            if (nearest >= 0 && nearest < cols)
            {
              slots[nearest].Add(component);
            }
          }

          for (int col = 0; col < cols; col++)
          {
            SlotBuild build = BuildSlot(slots[col], source.Width);
            builds[row, col] = build;
            if (build.HasSprite)
            {
              double fitScale = Math.Min(
                (double)(FrameW - SideMargin * 2) / build.CropW,
                (double)(FrameH - TopMargin - BottomMargin) / build.CropH
              );
              int group = row / 2;
              if (fitScale < groupScales[group])
              {
                groupScales[group] = fitScale;
              }
            }
          }
        }

        for (int row = 0; row < rows; row++)
        {
          for (int col = 0; col < cols; col++)
          {
            DrawSlot(sourceBytes, sourceStride, source.Width, row, col, builds[row, col], groupScales[row / 2], graphics);
          }
        }

        output.Save(outputPath, ImageFormat.Png);
        if (!String.IsNullOrEmpty(mirrorPath))
        {
          output.Save(mirrorPath, ImageFormat.Png);
        }
      }
    }
  }

  static List<SpriteComponent> FindRowComponents(byte[] bytes, int stride, int imageWidth, int sourceY)
  {
    int size = imageWidth * FrameH;
    bool[] visible = new bool[size];
    bool[] visited = new bool[size];

    for (int y = 0; y < FrameH; y++)
    {
      for (int x = 0; x < imageWidth; x++)
      {
        int sourceIndex = ((sourceY + y) * stride) + (x * 4);
        visible[(y * imageWidth) + x] = bytes[sourceIndex + 3] > AlphaThreshold;
      }
    }

    int[] queue = new int[size];
    List<SpriteComponent> components = new List<SpriteComponent>();

    for (int startY = 0; startY < FrameH; startY++)
    {
      for (int startX = 0; startX < imageWidth; startX++)
      {
        int start = (startY * imageWidth) + startX;
        if (!visible[start] || visited[start])
        {
          continue;
        }

        SpriteComponent component = new SpriteComponent();
        int head = 0;
        int tail = 0;
        visited[start] = true;
        queue[tail++] = start;

        while (head < tail)
        {
          int current = queue[head++];
          int x = current % imageWidth;
          int y = current / imageWidth;
          component.Add(current, x, y);

          for (int dy = -1; dy <= 1; dy++)
          {
            for (int dx = -1; dx <= 1; dx++)
            {
              if (dx == 0 && dy == 0) continue;
              int nx = x + dx;
              int ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= imageWidth || ny >= FrameH) continue;

              int next = (ny * imageWidth) + nx;
              if (visible[next] && !visited[next])
              {
                visited[next] = true;
                queue[tail++] = next;
              }
            }
          }
        }

        components.Add(component);
      }
    }

    return components;
  }

  static int FindNearestMain(SpriteComponent component, List<SpriteComponent> mainComponents)
  {
    int nearest = -1;
    double bestDistance = Double.MaxValue;
    for (int i = 0; i < mainComponents.Count; i++)
    {
      double distance = Math.Abs(component.CenterX - mainComponents[i].CenterX);
      if (distance < bestDistance)
      {
        nearest = i;
        bestDistance = distance;
      }
    }

    if (bestDistance > FrameW * 0.9)
    {
      return -1;
    }
    return nearest;
  }

  static SlotBuild BuildSlot(List<SpriteComponent> components, int imageWidth)
  {
    SlotBuild build = new SlotBuild();
    build.Components = components;
    if (components.Count == 0)
    {
      build.HasSprite = false;
      return build;
    }

    int minX = Int32.MaxValue;
    int minY = Int32.MaxValue;
    int maxX = -1;
    int maxY = -1;

    for (int i = 0; i < components.Count; i++)
    {
      SpriteComponent component = components[i];
      if (component.MinX < minX) minX = component.MinX;
      if (component.MinY < minY) minY = component.MinY;
      if (component.MaxX > maxX) maxX = component.MaxX;
      if (component.MaxY > maxY) maxY = component.MaxY;
    }

    minX = Math.Max(0, minX - Pad);
    minY = Math.Max(0, minY - Pad);
    maxX = Math.Min(imageWidth - 1, maxX + Pad);
    maxY = Math.Min(FrameH - 1, maxY + Pad);

    build.CropX = minX;
    build.CropY = minY;
    build.CropW = maxX - minX + 1;
    build.CropH = maxY - minY + 1;
    build.HasSprite = true;
    return build;
  }

  static void DrawSlot(byte[] sourceBytes, int sourceStride, int imageWidth, int row, int col, SlotBuild build, double scale, Graphics graphics)
  {
    if (build == null || !build.HasSprite)
    {
      return;
    }

    using (Bitmap piece = new Bitmap(build.CropW, build.CropH, PixelFormat.Format32bppArgb))
    {
      CopyComponents(sourceBytes, sourceStride, imageWidth, row * FrameH, build.CropX, build.CropY, build.CropW, build.CropH, build.Components, piece);

      double clampedScale = Math.Min(1.0, scale);
      int destW = Math.Max(1, (int)Math.Round(build.CropW * clampedScale));
      int destH = Math.Max(1, (int)Math.Round(build.CropH * clampedScale));
      int destX = (col * FrameW) + ((FrameW - destW) / 2);
      int destY = (row * FrameH) + FrameH - BottomMargin - destH;

      graphics.DrawImage(piece, new Rectangle(destX, destY, destW, destH), new Rectangle(0, 0, build.CropW, build.CropH), GraphicsUnit.Pixel);
    }
  }

  static void CopyComponents(byte[] sourceBytes, int sourceStride, int imageWidth, int sourceY, int cropX, int cropY, int cropW, int cropH, List<SpriteComponent> components, Bitmap piece)
  {
    Rectangle rect = new Rectangle(0, 0, cropW, cropH);
    BitmapData pieceData = piece.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    byte[] pieceBytes = new byte[Math.Abs(pieceData.Stride) * cropH];

    for (int c = 0; c < components.Count; c++)
    {
      SpriteComponent component = components[c];
      for (int p = 0; p < component.Pixels.Count; p++)
      {
        int rowIndex = component.Pixels[p];
        int sourceX = rowIndex % imageWidth;
        int sourceLocalY = rowIndex / imageWidth;
        int x = sourceX - cropX;
        int y = sourceLocalY - cropY;
        if (x < 0 || y < 0 || x >= cropW || y >= cropH)
        {
          continue;
        }

        int sourceIndex = ((sourceY + sourceLocalY) * sourceStride) + (sourceX * 4);
        int pieceIndex = (y * pieceData.Stride) + (x * 4);
        pieceBytes[pieceIndex] = sourceBytes[sourceIndex];
        pieceBytes[pieceIndex + 1] = sourceBytes[sourceIndex + 1];
        pieceBytes[pieceIndex + 2] = sourceBytes[sourceIndex + 2];
        pieceBytes[pieceIndex + 3] = sourceBytes[sourceIndex + 3];
      }
    }

    Marshal.Copy(pieceBytes, 0, pieceData.Scan0, pieceBytes.Length);
    piece.UnlockBits(pieceData);
  }
}
"@

Add-Type -TypeDefinition $NormalizerCode -ReferencedAssemblies "System.Drawing"
[ExtraNpcSheetNormalizer]::Normalize($SourceSheet, $OutSheet, $SourceMirror)
Write-Output "Normalized extra NPC sheet: $OutSheet"
