#!/usr/bin/env python3
"""
Generate native Android and iOS launcher icons and splash screens
using the official Jeevan branding assets.
"""

import os
from PIL import Image, ImageOps

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRANDING_DIR = os.path.join(BASE_DIR, "client", "public", "branding")
ANDROID_RES = os.path.join(BASE_DIR, "client", "android", "app", "src", "main", "res")
IOS_ASSETS = os.path.join(BASE_DIR, "client", "ios", "App", "App", "Assets.xcassets")

EMBLEM_PATH = os.path.join(BRANDING_DIR, "jeevan-emblem.png")
LOGO_PATH = os.path.join(BRANDING_DIR, "jeevan-logo.png")
ICON_192_PATH = os.path.join(BRANDING_DIR, "jeevan-icon-192.png")

# Background color for splash screens (Dark Obsidian)
DARK_BG_COLOR = (7, 8, 12, 255) # #07080C

MIPMAP_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ANDROID_SPLASH_SIZES = {
    # Port: W x H
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    # Land: W x H
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

def create_circular_icon(img):
    mask = Image.new("L", img.size, 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
    result = Image.new("RGBA", img.size, (0, 0, 0, 0))
    result.paste(img, (0, 0), mask=mask)
    return result

def generate_android_icons(emblem):
    print("Generating Android mipmap launcher icons...")
    for folder, size in MIPMAP_SIZES.items():
        folder_path = os.path.join(ANDROID_RES, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Square / rounded launcher icon
        resized = emblem.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
        
        # Round icon
        round_icon = create_circular_icon(resized)
        round_icon.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
        
        # Foreground icon for adaptive icons (with safe inset ~66%)
        fg_size = int(size * 1.5) # adaptive foreground is larger
        fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        emblem_resized = emblem.resize((int(fg_size * 0.65), int(fg_size * 0.65)), Image.Resampling.LANCZOS)
        offset = ((fg_size - emblem_resized.width) // 2, (fg_size - emblem_resized.height) // 2)
        fg_canvas.paste(emblem_resized, offset, mask=emblem_resized if emblem_resized.mode == "RGBA" else None)
        fg_canvas.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
        print(f"  -> {folder}: {size}x{size}")

def generate_android_splashes(emblem):
    print("Generating Android splash screens...")
    for folder, (w, h) in ANDROID_SPLASH_SIZES.items():
        folder_path = os.path.join(ANDROID_RES, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        canvas = Image.new("RGBA", (w, h), DARK_BG_COLOR)
        # Emblem sized proportionally (around 35% of min dimension)
        target_size = int(min(w, h) * 0.40)
        resized_emblem = emblem.resize((target_size, target_size), Image.Resampling.LANCZOS)
        pos = ((w - target_size) // 2, (h - target_size) // 2)
        canvas.paste(resized_emblem, pos, mask=resized_emblem if resized_emblem.mode == "RGBA" else None)
        
        canvas.save(os.path.join(folder_path, "splash.png"), "PNG")
        print(f"  -> {folder}: {w}x{h}")
        
    # Also default drawable splash
    drawable_dir = os.path.join(ANDROID_RES, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    canvas = Image.new("RGBA", (800, 800), DARK_BG_COLOR)
    target_size = 320
    resized_emblem = emblem.resize((target_size, target_size), Image.Resampling.LANCZOS)
    canvas.paste(resized_emblem, ((800 - target_size)//2, (800 - target_size)//2), mask=resized_emblem if resized_emblem.mode == "RGBA" else None)
    canvas.save(os.path.join(drawable_dir, "splash.png"), "PNG")

def generate_ios_assets(emblem):
    print("Generating iOS icons and splash...")
    app_icon_dir = os.path.join(IOS_ASSETS, "AppIcon.appiconset")
    if os.path.exists(app_icon_dir):
        # 1024x1024 App Store icon
        ios_app_icon = Image.new("RGBA", (1024, 1024), DARK_BG_COLOR)
        emblem_800 = emblem.resize((800, 800), Image.Resampling.LANCZOS)
        ios_app_icon.paste(emblem_800, (112, 112), mask=emblem_800 if emblem_800.mode == "RGBA" else None)
        # Save as RGB without alpha channel as required by App Store
        ios_app_icon_rgb = ios_app_icon.convert("RGB")
        ios_app_icon_rgb.save(os.path.join(app_icon_dir, "AppIcon-512@2x.png"), "PNG")
        print("  -> AppIcon-512@2x.png: 1024x1024")
        
    splash_dir = os.path.join(IOS_ASSETS, "Splash.imageset")
    if os.path.exists(splash_dir):
        splash_canvas = Image.new("RGBA", (2732, 2732), DARK_BG_COLOR)
        emblem_1000 = emblem.resize((1000, 1000), Image.Resampling.LANCZOS)
        splash_canvas.paste(emblem_1000, ((2732 - 1000)//2, (2732 - 1000)//2), mask=emblem_1000 if emblem_1000.mode == "RGBA" else None)
        splash_canvas.save(os.path.join(splash_dir, "splash-2732x2732.png"), "PNG")
        splash_canvas.save(os.path.join(splash_dir, "splash-2732x2732-1.png"), "PNG")
        splash_canvas.save(os.path.join(splash_dir, "splash-2732x2732-2.png"), "PNG")
        print("  -> iOS splash images: 2732x2732")

def main():
    if not os.path.exists(EMBLEM_PATH):
        print(f"Error: Emblem not found at {EMBLEM_PATH}")
        return
        
    emblem = Image.open(EMBLEM_PATH).convert("RGBA")
    generate_android_icons(emblem)
    generate_android_splashes(emblem)
    generate_ios_assets(emblem)
    print("All native assets generated successfully!")

if __name__ == "__main__":
    main()
