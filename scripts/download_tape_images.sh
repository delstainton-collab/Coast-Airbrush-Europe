#!/bin/bash
set -e

DIR="assets/images"
mkdir -p "$DIR"

echo "Downloading authentic tape images from Flake King..."

curl -s "https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/WebGreenProSet.jpg?fit=600%2C600&ssl=1" -o "$DIR/flake-king-green-mixed-set.jpg"
curl -s "https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/Green1mm.png?fit=600%2C600&ssl=1" -o "$DIR/flake-king-green-tape-1mm.png"
curl -s "https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/WebOrangeProSet_1.jpg?fit=600%2C600&ssl=1" -o "$DIR/flake-king-orange-mixed-set.jpg"
curl -s "https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/Orange1mm.png?fit=600%2C600&ssl=1" -o "$DIR/flake-king-orange-tape-1mm.png"
curl -s "https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/FlatLine6mm.png?fit=600%2C600&ssl=1" -o "$DIR/flake-king-flat-line-tape.png"
curl -s "https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/UltiMaskCrepe18mmB.gif?fit=600%2C600&ssl=1" -o "$DIR/flake-king-ultimask-crepe.gif"

# Convert to webp using cwebp
/opt/homebrew/bin/cwebp -q 85 "$DIR/flake-king-green-mixed-set.jpg" -o "$DIR/flake-king-green-mixed-set.webp"
/opt/homebrew/bin/cwebp -q 85 "$DIR/flake-king-green-tape-1mm.png" -o "$DIR/flake-king-green-tape-1mm.webp"
/opt/homebrew/bin/cwebp -q 85 "$DIR/flake-king-orange-mixed-set.jpg" -o "$DIR/flake-king-orange-mixed-set.webp"
/opt/homebrew/bin/cwebp -q 85 "$DIR/flake-king-orange-tape-1mm.png" -o "$DIR/flake-king-orange-tape-1mm.webp"
/opt/homebrew/bin/cwebp -q 85 "$DIR/flake-king-flat-line-tape.png" -o "$DIR/flake-king-flat-line-tape.webp"

# Also create jpeg for ultimask
sips -s format jpeg "$DIR/flake-king-ultimask-crepe.gif" --out "$DIR/flake-king-ultimask-crepe.jpg" || true
/opt/homebrew/bin/cwebp -q 85 "$DIR/flake-king-ultimask-crepe.gif" -o "$DIR/flake-king-ultimask-crepe.webp" || true

echo "Done downloading and converting tape images:"
ls -lh "$DIR"/flake-king-*
