import os
import subprocess
from PIL import Image, ImageFilter, ImageEnhance

workspace = "/Volumes/Media SSD/Coast Airbrush Paint System"
assets_img = os.path.join(workspace, "assets", "images")
scratch_dir = "/Users/derekstainton/.gemini/antigravity/brain/1c94d9ff-6ac5-406b-be90-67d35a495de0/scratch"

# Read the SVG from scratch
svg_path = os.path.join(scratch_dir, "coast_pro.svg")
with open(svg_path, "r") as f:
    svg_content = f.read()

# 1. Save SVG directly into assets/images/favicon.svg
svg_dest = os.path.join(assets_img, "favicon.svg")
with open(svg_dest, "w") as f:
    f.write(svg_content)
print(f"Saved {svg_dest}")

# 2. Render 1024x1024 master PNG using sips
master_1024 = os.path.join(scratch_dir, "master_1024.png")
# sips can render the svg directly
subprocess.run(["sips", "-s", "format", "png", svg_dest, "--out", master_1024], check=True)
# Ensure master is 1024x1024
master_img = Image.open(master_1024).convert("RGBA")
if master_img.size != (1024, 1024):
    master_img = master_img.resize((1024, 1024), Image.Resampling.LANCZOS)
    master_img.save(master_1024)

# 3. Generate individual resolution layers with pixel tuning
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

# 4. Save Apple Touch Icon (180x180)
apple_touch_path = os.path.join(assets_img, "apple-touch-icon.png")
img_180.save(apple_touch_path)
print(f"Saved {apple_touch_path}")

# 5. Save PWA icons (192 and 512)
pwa_192 = os.path.join(assets_img, "icon-192.png")
pwa_512 = os.path.join(assets_img, "icon-512.png")
img_192.save(pwa_192)
master_img.resize((512, 512), Image.Resampling.LANCZOS).save(pwa_512)
print(f"Saved PWA icons: {pwa_192}, {pwa_512}")

# 6. Save root favicon.ico and assets/images/favicon.ico with multi-resolution layers:
# 256, 128, 64, 48, 32, 16
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
print(f"Saved multi-resolution ICO files:")
print(f"  {root_ico}")
print(f"  {assets_ico}")

# Verify ICO info
verify_img = Image.open(root_ico)
print(f"Root favicon.ico verified. Sizes included: {verify_img.info.get('sizes')}")
