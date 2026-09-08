import os
import subprocess
from PIL import Image, ImageEnhance, ImageDraw

workspace = "/Volumes/Media SSD/Coast Airbrush Paint System"
assets_img = os.path.join(workspace, "assets", "images")
scratch_dir = "/Users/derekstainton/.gemini/antigravity/brain/1c94d9ff-6ac5-406b-be90-67d35a495de0/scratch"

# Master SVG content: Coast Hot-Rod Slanted Speed "C" on Coast Red Tile
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Liquid Candy Red Gradient with High Optical Saturation -->
    <linearGradient id="coastRedTile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff2e3a"/>
      <stop offset="45%" stop-color="#e5232a"/>
      <stop offset="100%" stop-color="#9a0008"/>
    </linearGradient>

    <!-- Chrome/White drop shadow for 3D depth -->
    <filter id="cShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Edge-to-Edge Coast Red Squircle Tile (Maximum Canvas Presence) -->
  <rect x="12" y="12" width="488" height="488" rx="124" fill="url(#coastRedTile)"/>

  <!-- Subtle Top-Left Automotive Glass Sheen -->
  <path d="M 24 130 C 24 70 70 24 130 24 L 380 24 C 270 45 150 110 80 240 C 50 195 24 155 24 130 Z" fill="#ffffff" opacity="0.12"/>

  <!-- THE AUTHENTIC COAST HOT-ROD SLANTED SPEED "C" -->
  <g filter="url(#cShadow)">
    <path d="M 465 105 C 410 75 320 62 245 80 C 155 102 78 165 42 255 C 8 340 32 425 98 465 C 168 505 275 490 365 448 C 428 418 468 372 485 335 L 380 298 C 362 322 330 350 278 360 C 215 372 165 352 138 312 C 108 265 118 205 168 162 C 220 120 305 115 365 138 C 392 148 415 165 432 188 L 495 138 C 485 125 476 114 465 105 Z" 
          fill="#ffffff"/>
  </g>
</svg>
"""

# 1. Write SVG to assets/images/favicon.svg
svg_dest = os.path.join(assets_img, "favicon.svg")
with open(svg_dest, "w") as f:
    f.write(svg_content)
print(f"Saved {svg_dest}")

# 2. Render 1024x1024 master
master_1024 = os.path.join(scratch_dir, "legible_master_1024.png")
subprocess.run(["sips", "-s", "format", "png", svg_dest, "--out", master_1024], check=True)
master_img = Image.open(master_1024).convert("RGBA")
if master_img.size != (1024, 1024):
    master_img = master_img.resize((1024, 1024), Image.Resampling.LANCZOS)
    master_img.save(master_1024)

# 3. Produce multi-resolution layers
def produce_layer(img, size, sharpen_amount=0):
    layer = img.resize((size, size), Image.Resampling.LANCZOS)
    if sharpen_amount > 0:
        enhancer = ImageEnhance.Sharpness(layer)
        layer = enhancer.enhance(sharpen_amount)
    return layer

img_256 = produce_layer(master_img, 256, 1.1)
img_192 = produce_layer(master_img, 192, 1.15)
img_180 = produce_layer(master_img, 180, 1.2)
img_128 = produce_layer(master_img, 128, 1.2)
img_64  = produce_layer(master_img, 64, 1.3)
img_48  = produce_layer(master_img, 48, 1.35)
img_32  = produce_layer(master_img, 32, 1.45)
img_16  = produce_layer(master_img, 16, 1.6)

# 4. Save PNG variants
apple_touch_path = os.path.join(assets_img, "apple-touch-icon.png")
pwa_192 = os.path.join(assets_img, "icon-192.png")
pwa_512 = os.path.join(assets_img, "icon-512.png")

img_180.save(apple_touch_path)
img_192.save(pwa_192)
master_img.resize((512, 512), Image.Resampling.LANCZOS).save(pwa_512)

# 5. Save multi-resolution ICO
root_ico = os.path.join(workspace, "favicon.ico")
assets_ico = os.path.join(assets_img, "favicon.ico")

img_256.save(
    root_ico,
    format="ICO",
    append_images=[img_128, img_64, img_48, img_32, img_16]
)
img_256.save(
    assets_ico,
    format="ICO",
    append_images=[img_128, img_64, img_48, img_32, img_16]
)
print("Updated favicon.ico with ultra-legible layers.")

# 6. Generate Side-by-Side Comparison: BEFORE vs AFTER on Google Chrome Tab
comp_w = 960
comp_h = 420
comp = Image.new("RGBA", (comp_w, comp_h), "#181a1b")
draw = ImageDraw.Draw(comp)

draw.text((30, 20), "BEFORE vs AFTER: GOOGLE CHROME TAB LEGIBILITY BENCHMARK", fill="#ffffff")

# Load old icon
old_img = Image.open(f"{scratch_dir}/coast_pro_512.png")
old_16 = old_img.resize((16, 16), Image.Resampling.LANCZOS)
old_16 = ImageEnhance.Sharpness(old_16).enhance(1.6)

new_16 = img_16

# Section 1: BEFORE (Overly detailed dark squircle)
draw.text((30, 65), "BEFORE: Over-Detailed Dark Bezel (Illegible at 16x16)", fill="#ff6b6b")
y1 = 95
# Dark Tab
draw.rectangle([30, y1, 420, y1 + 44], fill="#323639", outline="#494c50")
comp.paste(old_16, (44, y1 + 14), old_16)
draw.text((72, y1 + 13), "Coast Airbrush Europe | Custom Paint", fill="#f1f3f4")
draw.text((395, y1 + 12), "×", fill="#9aa0a6")

# Light Tab
draw.rectangle([460, y1, 850, y1 + 44], fill="#ffffff", outline="#dadce0")
comp.paste(old_16, (474, y1 + 14), old_16)
draw.text((502, y1 + 13), "Coast Airbrush Europe | Custom Paint", fill="#202124")
draw.text((825, y1 + 12), "×", fill="#5f6368")

# 32px
old_32 = old_img.resize((32, 32), Image.Resampling.LANCZOS)
comp.paste(old_32, (880, y1 + 6), old_32)
draw.text((880, y1 + 45), "32px", fill="#9aa0a6")

# Section 2: AFTER (Coast Hot-Rod Speed "C" on Coast Red Tile)
draw.text((30, 185), "AFTER: Bold Hot-Rod Coast 'C' on Coast Red Tile (100% Crisp & Legible)", fill="#51cf66")
y2 = 215
# Dark Tab
draw.rectangle([30, y2, 420, y2 + 44], fill="#323639", outline="#494c50")
comp.paste(new_16, (44, y2 + 14), new_16)
draw.text((72, y2 + 13), "Coast Airbrush Europe | Custom Paint", fill="#f1f3f4")
draw.text((395, y2 + 12), "×", fill="#9aa0a6")

# Light Tab
draw.rectangle([460, y2, 850, y2 + 44], fill="#ffffff", outline="#dadce0")
comp.paste(new_16, (474, y2 + 14), new_16)
draw.text((502, y2 + 13), "Coast Airbrush Europe | Custom Paint", fill="#202124")
draw.text((825, y2 + 12), "×", fill="#5f6368")

# 32px
new_32 = img_32
comp.paste(new_32, (880, y2 + 6), new_32)
draw.text((880, y2 + 45), "32px", fill="#9aa0a6")

# Resolutions row below
y3 = 295
draw.text((30, y3), "FULL RESOLUTION SUITE IN UPDATED FAVICON.ICO:", fill="#e2e2e2")
sizes_to_show = [(16, new_16), (32, new_32), (48, img_48), (64, img_64), (128, img_128)]
x_r = 30
for sz, im_sz in sizes_to_show:
    card_w = max(sz + 30, 80)
    draw.rectangle([x_r, y3 + 25, x_r + card_w, y3 + 115], fill="#202326", outline="#30353a")
    px = x_r + (card_w - min(sz, 64)) // 2
    py = y3 + 32 + (64 - min(sz, 64)) // 2
    if sz > 64:
        im_disp = im_sz.resize((64, 64), Image.Resampling.LANCZOS)
        comp.paste(im_disp, (px, py), im_disp)
    else:
        comp.paste(im_sz, (px, py), im_sz)
    draw.text((x_r + 10, y3 + 96), f"{sz}x{sz}", fill="#ffb3ac")
    x_r += card_w + 15

before_after_path = f"{scratch_dir}/before_after_benchmark.png"
comp.save(before_after_path)
print(f"Saved {before_after_path}")
