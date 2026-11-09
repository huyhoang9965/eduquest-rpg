import os
from PIL import Image

upload_dir = r"C:\Users\asus\.gemini\antigravity\brain\afe4a535-cc3b-4d0a-b801-bd1f00fc7d86\.user_uploaded"

def analyze_sheet(filename, desc):
    path = os.path.join(upload_dir, filename)
    im = Image.open(path).convert('RGB')
    w, h = im.size
    print(f"\n=== {desc} ({filename}): {w}x{h} ===")
    
    # Calculate row-wise and column-wise brightness
    row_bright = []
    for y in range(h):
        b = sum(sum(im.getpixel((x, y))) for x in range(0, w, 4))
        row_bright.append(b)
    
    col_bright = []
    for x in range(w):
        b = sum(sum(im.getpixel((x, y))) for y in range(0, h, 4))
        col_bright.append(b)
        
    # Find active rows
    active_rows = [y for y, b in enumerate(row_bright) if b > 500]
    active_cols = [x for x, b in enumerate(col_bright) if b > 500]
    if active_rows:
        print(f"Active rows: {active_rows[0]} to {active_rows[-1]}")
    if active_cols:
        print(f"Active cols: {active_cols[0]} to {active_cols[-1]}")

analyze_sheet("media_1793872051009.jpg", "01_heroes_and_pets")
analyze_sheet("media_1793872046001.jpg", "02_monsters_and_bosses")
analyze_sheet("media_1793872055933.jpg", "05_equipment_and_rewards")
