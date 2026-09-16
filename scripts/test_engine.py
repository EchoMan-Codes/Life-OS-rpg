import os
import sys
import numpy as np
from PIL import Image

ref_path = r"C:\Users\Lenovo\.gemini\antigravity-ide\brain\b4770cca-a3bd-4cfa-af1e-9b899982025f\.user_uploaded\media_1789530538741.png"

print(f"Checking reference image at: {ref_path}")
if not os.path.exists(ref_path):
    print("Error: Reference image not found!")
    sys.exit(1)

img = Image.open(ref_path).convert("RGBA")
print(f"Loaded image successfully: size={img.size}, mode={img.mode}")
