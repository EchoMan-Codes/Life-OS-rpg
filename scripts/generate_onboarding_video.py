import os
import sys
import math
import subprocess
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def generate_cinematic_onboarding_video():
    master_path = r"C:\Users\Lenovo\.gemini\antigravity-ide\brain\b4770cca-a3bd-4cfa-af1e-9b899982025f\widescreen_landscape_1789531995887.jpg"
    out_dir = r"d:\PROJECT\client\public\videos"
    os.makedirs(out_dir, exist_ok=True)
    
    webm_out = os.path.join(out_dir, "onboarding-loop.webm")
    mp4_out = os.path.join(out_dir, "onboarding-loop.mp4")
    poster_out = os.path.join(out_dir, "onboarding-poster.webp")
    
    print(f"Loading master artwork from {master_path}...")
    master_img = Image.open(master_path).convert("RGBA")
    src_w, src_h = master_img.size # 1376, 768
    
    # Target resolution: 1920x1080 (upscaled with high-quality Lanczos for crisp 1080p)
    target_w, target_h = 1920, 1080
    base_1080 = master_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Save the master pristine image as the poster fallback
    base_1080.save(poster_out, "WEBP", quality=92)
    print(f"Saved pristine poster to {poster_out}")
    
    fps = 30
    duration = 8.0 # 8.0s seamless loop
    total_frames = int(fps * duration) # 240 frames
    print(f"Rendering {total_frames} frames @ {fps}fps ({duration}s loop) at {target_w}x{target_h}...")
    
    # Key coordinates scaled to 1920x1080:
    scale_x = target_w / src_w
    scale_y = target_h / src_h
    
    # Moon in 1920x1080:
    moon_x = int(848 * scale_x)  # ~1183
    moon_y = int(186 * scale_y)  # ~261
    moon_r = int(42 * scale_x)   # ~58
    
    # Reflected moon in water:
    refl_moon_x = int(896 * scale_x) # ~1250
    refl_moon_y = int(680 * scale_y) # ~956
    
    # Lake region in 1920x1080:
    lake_top = int(485 * scale_y) # ~682
    lake_bot = int(720 * scale_y) # ~1012
    
    # Cloud regions (masks for gentle floating drift):
    # Left clouds:
    # Right clouds:
    # We will create floating cloud offset masks
    
    # Generate star catalog in the sky region (above lake_top):
    np.random.seed(1337)
    num_stars = 160
    stars = []
    for _ in range(num_stars):
        sx = np.random.randint(30, target_w - 30)
        sy = np.random.randint(20, lake_top - 50)
        # Avoid moon center
        if math.hypot(sx - moon_x, sy - moon_y) < moon_r * 2.2:
            continue
        base_bright = np.random.uniform(0.35, 0.95)
        twinkle_amp = np.random.uniform(0.2, 0.45)
        harmonic = np.random.choice([1, 2, 3, 4]) # integer cycles per 8s
        phase = np.random.uniform(0, 2 * math.pi)
        size = np.random.choice([1, 1, 2, 2, 3])
        stars.append((sx, sy, base_bright, twinkle_amp, harmonic, phase, size))
        
    # Floating atmospheric stardust motes (30 motes near lake and shoreline)
    motes = []
    for _ in range(30):
        mx = np.random.randint(100, target_w - 100)
        my = np.random.randint(lake_top - 40, target_h - 30)
        drift_r = np.random.uniform(8, 18)
        phase = np.random.uniform(0, 2 * math.pi)
        size = np.random.uniform(1.8, 3.5)
        harm = np.random.choice([1, 2])
        motes.append((mx, my, drift_r, phase, size, harm))

    # Base array as float32
    base_arr = np.array(base_1080, dtype=np.float32)
    
    # Pre-extract lake sub-array for wave displacement
    lake_h = lake_bot - lake_top
    lake_orig = base_arr[lake_top:lake_bot, :, :].copy()
    
    # FFmpeg pipe
    temp_mp4 = os.path.join(out_dir, "temp_cinematic.mp4")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{target_w}x{target_h}",
        "-pix_fmt", "rgba",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high",
        "-preset", "medium",
        "-crf", "18", # High visual quality
        temp_mp4
    ]
    
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
    
    # Meshgrid for lake coordinates
    grid_y, grid_x = np.mgrid[0:lake_h, 0:target_w]
    
    print("Beginning frame rendering loop...")
    for frame_idx in range(total_frames):
        norm_t = frame_idx / total_frames # 0.0 to 1.0 (exact loop at 1.0)
        frame_arr = base_arr.copy()
        
        # ── 1. Animated Lake Water Surface (Fluid 2D Displacement) ──
        # Harmonic frequencies: 2 and 3 cycles per 8s
        w1 = 2 * math.pi * 2 * norm_t
        w2 = 2 * math.pi * 3 * norm_t
        w3 = 2 * math.pi * 1 * norm_t
        
        # Wave displacements in x and y (seamlessly periodic)
        # Amplitude increases slightly towards the bottom of the lake (perspective)
        depth_factor = (grid_y / lake_h) * 1.5 + 0.5
        dx = (1.8 * np.sin(grid_x * 0.025 + grid_y * 0.06 + w1) +
              1.0 * np.cos(grid_x * 0.04 - grid_y * 0.03 + w2)) * depth_factor
        dy = (1.2 * np.sin(grid_x * 0.03 - grid_y * 0.04 + w2) +
              0.8 * np.cos(grid_x * 0.015 + grid_y * 0.05 + w1)) * depth_factor
              
        # Sample displaced coordinates with clipping
        sample_x = np.clip(np.round(grid_x + dx).astype(int), 0, target_w - 1)
        sample_y = np.clip(np.round(grid_y + dy).astype(int), 0, lake_h - 1)
        
        # Displaced lake reflection
        displaced_lake = lake_orig[sample_y, sample_x, :]
        
        # Add animated specular shimmer on the moon reflection column
        dist_from_moon_col = np.abs(grid_x - refl_moon_x)
        moon_column = np.exp(- (dist_from_moon_col ** 2) / (2 * (130 ** 2)))
        # Rippling specular highlights
        water_caustic = (0.5 + 0.5 * np.sin(grid_y * 0.12 + w1 * 2 + grid_x * 0.03)) * moon_column * 22.0
        
        displaced_lake[:, :, 0] = np.clip(displaced_lake[:, :, 0] + water_caustic * 0.85, 0, 255)
        displaced_lake[:, :, 1] = np.clip(displaced_lake[:, :, 1] + water_caustic * 0.75, 0, 255)
        displaced_lake[:, :, 2] = np.clip(displaced_lake[:, :, 2] + water_caustic * 1.0, 0, 255)
        
        frame_arr[lake_top:lake_bot, :, :] = displaced_lake
        
        # ── 2. Moon Breathing Aura / Corona ──
        moon_pulse = 1.0 + 0.08 * math.sin(2 * math.pi * norm_t)
        corona_radius = int(moon_r * 3.2 * moon_pulse)
        y_min = max(0, moon_y - corona_radius)
        y_max = min(target_h, moon_y + corona_radius)
        x_min = max(0, moon_x - corona_radius)
        x_max = min(target_w, moon_x + corona_radius)
        
        cy, cx = np.ogrid[y_min:y_max, x_min:x_max]
        dist_from_moon = np.sqrt((cx - moon_x) ** 2 + (cy - moon_y) ** 2)
        corona_mask = np.clip(1.0 - (dist_from_moon / corona_radius), 0, 1) ** 2.4
        glow_intensity = 22.0 * (0.85 + 0.15 * math.sin(2 * math.pi * norm_t))
        
        frame_arr[y_min:y_max, x_min:x_max, 0] += corona_mask * glow_intensity * 0.95
        frame_arr[y_min:y_max, x_min:x_max, 1] += corona_mask * glow_intensity * 0.85
        frame_arr[y_min:y_max, x_min:x_max, 2] += corona_mask * glow_intensity * 1.15
        
        # Convert to PIL Image for crisp vector overlays (stars, motes, shooting star)
        frame_img = Image.fromarray(np.clip(frame_arr, 0, 255).astype(np.uint8), "RGBA")
        draw = ImageDraw.Draw(frame_img)
        
        # ── 3. Twinkling Stars (Exact integer harmonic cycles) ──
        for sx, sy, base_b, amp, harm, ph, sz in stars:
            lum = base_b + amp * math.sin(2 * math.pi * harm * norm_t + ph)
            lum = max(0.12, min(1.0, lum))
            alpha = int(lum * 255)
            star_color = (250, 240, 255, alpha)
            if sz == 1:
                draw.point((sx, sy), fill=star_color)
            else:
                r = sz - 1
                draw.ellipse([sx - r, sy - r, sx + r, sy + r], fill=star_color)
                if lum > 0.82:
                    flare_len = sz + 1
                    draw.line([(sx - flare_len, sy), (sx + flare_len, sy)], fill=(255, 255, 255, int(alpha * 0.6)))
                    draw.line([(sx, sy - flare_len), (sx, sy + flare_len)], fill=(255, 255, 255, int(alpha * 0.6)))

        # ── 4. Occasional Shooting Star (t in [0.24, 0.44], 100% vanishes before t=1.0) ──
        shoot_s = 0.24
        shoot_e = 0.42
        if shoot_s <= norm_t <= shoot_e:
            prog = (norm_t - shoot_s) / (shoot_e - shoot_s)
            opacity = math.sin(prog * math.pi)
            cur_x = int(240 + prog * 360)
            cur_y = int(90 + prog * 160)
            tail_len = int(55 * opacity)
            tail_x = cur_x - tail_len
            tail_y = cur_y - int(tail_len * 0.44)
            sh_alpha = int(opacity * 210)
            draw.line([(tail_x, tail_y), (cur_x, cur_y)], fill=(255, 240, 255, sh_alpha), width=2)
            draw.ellipse([cur_x - 1, cur_y - 1, cur_x + 1, cur_y + 1], fill=(255, 255, 255, sh_alpha))

        # ── 5. Floating Motes / Stardust (Harmonic closed paths) ──
        for mx, my, dr, ph, sz, harm in motes:
            mote_x = mx + dr * math.sin(2 * math.pi * harm * norm_t + ph)
            mote_y = my - (dr * 0.7) * math.cos(2 * math.pi * harm * norm_t + ph)
            mote_alpha = int((0.45 + 0.45 * math.sin(2 * math.pi * harm * norm_t + ph)) * 180)
            r = sz / 2.0
            draw.ellipse([mote_x - r, mote_y - r, mote_x + r, mote_y + r], fill=(235, 215, 255, mote_alpha))

        # ── 6. Micro Cinematic Parallax Breathing (0.4% subtle scale, perfectly closed loop) ──
        # Uses (1 - cos(2*pi*t)) / 2 which is 0 at t=0 and 0 at t=1
        breathe = 0.004 * (1.0 - math.cos(2 * math.pi * norm_t)) / 2.0 # 0.0 to 0.004
        if breathe > 0.0005:
            crop_dx = int(target_w * breathe / 2.0)
            crop_dy = int(target_h * breathe / 2.0)
            cropped = frame_img.crop((crop_dx, crop_dy, target_w - crop_dx, target_h - crop_dy))
            frame_img = cropped.resize((target_w, target_h), Image.Resampling.BILINEAR)

        # Pipe raw RGBA frame to FFmpeg
        proc.stdin.write(frame_img.tobytes())
        
        if frame_idx % 40 == 0 or frame_idx == total_frames - 1:
            print(f"Rendered frame {frame_idx + 1}/{total_frames} ({(frame_idx + 1)/total_frames*100:.1f}%)")
            
    proc.stdin.close()
    proc.wait()
    print("Master animation rendered to temp MP4. Now generating optimized delivery formats...")
    
    # 1. Final MP4 (H.264, universally compatible with iOS Safari, Chrome, Edge)
    subprocess.run([
        "ffmpeg", "-y", "-i", temp_mp4,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "20",
        "-preset", "slow",
        "-movflags", "+faststart",
        mp4_out
    ], check=True)
    print(f"Generated: {mp4_out} ({os.path.getsize(mp4_out) / 1024 / 1024:.2f} MB)")
    
    # 2. Final WebM (VP9, ultra-compact for modern browsers)
    subprocess.run([
        "ffmpeg", "-y", "-i", temp_mp4,
        "-c:v", "libvpx-vp9",
        "-b:v", "0",
        "-crf", "28",
        "-an",
        webm_out
    ], check=True)
    print(f"Generated: {webm_out} ({os.path.getsize(webm_out) / 1024 / 1024:.2f} MB)")
    
    if os.path.exists(temp_mp4):
        os.remove(temp_mp4)
        
    print("SUCCESS: Master cinematic video assets created successfully!")

if __name__ == "__main__":
    generate_cinematic_onboarding_video()
