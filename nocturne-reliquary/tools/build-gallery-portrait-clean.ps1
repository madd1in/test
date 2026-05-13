Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$In = Join-Path $Root "assets\generated\props_imagen_hd_gallery_portraits.png"
$Out = Join-Path $Root "assets\generated\props_imagen_hd_gallery_portraits_clean.png"

Add-Type -ReferencedAssemblies "System.Drawing" -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class GalleryPortraitMatteCleaner {
  static int Clamp(int value, int min, int max) {
    return value < min ? min : value > max ? max : value;
  }

  static bool IsKeyGreen(byte r, byte g, byte b, byte a) {
    if (a < 8) return false;
    int maxRb = Math.Max(r, b);
    int dominance = g - maxRb;
    if (g > 185 && r < 135 && b < 150) return true;
    if (g > 150 && dominance > 14 && g > r * 1.07 && g > b * 1.03) return true;
    if (g > 90 && dominance > 22 && g > r * 1.12 && g > b * 1.06) return true;
    return false;
  }

  static bool IsEdgeSpillGreen(byte r, byte g, byte b, byte a) {
    if (a < 8) return false;
    int maxRb = Math.Max(r, b);
    int dominance = g - maxRb;
    if (g > 80 && dominance > 8 && g > r * 1.04 && g > b * 1.02) return true;
    if (g > 130 && dominance > 5 && r < 150 && b < 150) return true;
    return false;
  }

  static int Offset(int x, int y, int stride) {
    return y * stride + x * 4;
  }

  static bool NearMask(bool[] mask, int width, int height, int x, int y, int radius) {
    int minX = Math.Max(0, x - radius);
    int maxX = Math.Min(width - 1, x + radius);
    int minY = Math.Max(0, y - radius);
    int maxY = Math.Min(height - 1, y + radius);
    for (int yy = minY; yy <= maxY; yy++) {
      int row = yy * width;
      for (int xx = minX; xx <= maxX; xx++) {
        if (mask[row + xx]) return true;
      }
    }
    return false;
  }

  public static void Clean(string inputPath, string outputPath) {
    using (Bitmap source = new Bitmap(inputPath))
    using (Bitmap bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
      using (Graphics g = Graphics.FromImage(bitmap)) {
        g.DrawImage(source, 0, 0, source.Width, source.Height);
      }

      int width = bitmap.Width;
      int height = bitmap.Height;
      Rectangle rect = new Rectangle(0, 0, width, height);
      BitmapData bits = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = Math.Abs(bits.Stride);
      byte[] data = new byte[stride * height];
      Marshal.Copy(bits.Scan0, data, 0, data.Length);

      bool[] matte = new bool[width * height];
      Queue<int> queue = new Queue<int>();
      Action<int, int> seed = (x, y) => {
        int idx = y * width + x;
        if (matte[idx]) return;
        int o = Offset(x, y, stride);
        byte b = data[o];
        byte g = data[o + 1];
        byte r = data[o + 2];
        byte a = data[o + 3];
        if (!IsKeyGreen(r, g, b, a)) return;
        matte[idx] = true;
        queue.Enqueue(idx);
      };

      for (int x = 0; x < width; x++) {
        seed(x, 0);
        seed(x, height - 1);
      }
      for (int y = 0; y < height; y++) {
        seed(0, y);
        seed(width - 1, y);
      }

      int[] dirs = new int[] { 1, 0, -1, 0, 0, 1, 0, -1, 1, 1, -1, -1, 1, -1, -1, 1 };
      while (queue.Count > 0) {
        int idx = queue.Dequeue();
        int x = idx % width;
        int y = idx / width;
        for (int i = 0; i < dirs.Length; i += 2) {
          int nx = x + dirs[i];
          int ny = y + dirs[i + 1];
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          int next = ny * width + nx;
          if (matte[next]) continue;
          int o = Offset(nx, ny, stride);
          byte b = data[o];
          byte g = data[o + 1];
          byte r = data[o + 2];
          byte a = data[o + 3];
          if (!IsKeyGreen(r, g, b, a)) continue;
          matte[next] = true;
          queue.Enqueue(next);
        }
      }

      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          int idx = y * width + x;
          if (matte[idx]) continue;
          int o = Offset(x, y, stride);
          byte b = data[o];
          byte g = data[o + 1];
          byte r = data[o + 2];
          byte a = data[o + 3];
          if (IsKeyGreen(r, g, b, a)) matte[idx] = true;
        }
      }

      bool[] cut = (bool[])matte.Clone();
      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          int idx = y * width + x;
          if (matte[idx] || !NearMask(matte, width, height, x, y, 3)) continue;
          int o = Offset(x, y, stride);
          byte b = data[o];
          byte g = data[o + 1];
          byte r = data[o + 2];
          byte a = data[o + 3];
          int maxRb = Math.Max(r, b);
          int spill = g - maxRb;
          if (IsEdgeSpillGreen(r, g, b, a) && (spill > 12 || g > 120)) {
            cut[idx] = true;
          } else if (spill > 3 && g > 45) {
            data[o + 1] = (byte)Clamp(maxRb + 1, 0, 255);
            if (spill > 10) data[o + 3] = (byte)Math.Max(0, a - Math.Min(80, spill * 2));
          }
        }
      }

      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          int idx = y * width + x;
          int o = Offset(x, y, stride);
          if (cut[idx]) {
            data[o] = 0;
            data[o + 1] = 0;
            data[o + 2] = 0;
            data[o + 3] = 0;
            continue;
          }
          if (!NearMask(cut, width, height, x, y, 2)) continue;
          byte b = data[o];
          byte g = data[o + 1];
          byte r = data[o + 2];
          int maxRb = Math.Max(r, b);
          int spill = g - maxRb;
          if (spill > 2) {
            data[o + 1] = (byte)Clamp(maxRb + 1, 0, 255);
            if (spill > 12) data[o + 3] = (byte)Math.Max(0, data[o + 3] - Math.Min(52, spill));
          }
        }
      }

      Marshal.Copy(data, 0, bits.Scan0, data.Length);
      bitmap.UnlockBits(bits);
      Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
      bitmap.Save(outputPath, ImageFormat.Png);
    }
  }
}
"@

[GalleryPortraitMatteCleaner]::Clean($In, $Out)
Write-Output "Wrote $Out"
