import os
import shutil
from PIL import Image

upload_dir = r"C:\Users\asus\.gemini\antigravity\brain\afe4a535-cc3b-4d0a-b801-bd1f00fc7d86\.user_uploaded"

def make_transparent(im, black_threshold=22, feather_range=20):
    """Convert black/dark background to transparent with anti-aliasing feather."""
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    
    for item in datas:
        r, g, b, a = item
        # Calculate maximum channel or perceived brightness
        # In black backgrounds, max(r, g, b) is low
        max_c = max(r, g, b)
        if max_c <= black_threshold:
            new_data.append((r, g, b, 0))
        elif max_c < black_threshold + feather_range:
            # Smooth transition
            alpha = int(255 * (max_c - black_threshold) / feather_range)
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, 255))
            
    im.putdata(new_data)
    # Auto-crop to content bounding box
    bbox = im.getbbox()
    if bbox:
        # Pad by 2px
        w, h = im.size
        pad_bbox = (
            max(0, bbox[0] - 2),
            max(0, bbox[1] - 2),
            min(w, bbox[2] + 2),
            min(h, bbox[3] + 2)
        )
        im = im.crop(pad_bbox)
    return im

# 1. Process Heroes and Pets (media_1793872051009.jpg)
img_hp = Image.open(os.path.join(upload_dir, "media_1793872051009.jpg"))
w_hp, h_hp = img_hp.size

hero_boxes = {
    "warrior": (0, 0, 336, 400),
    "mage": (336, 0, 687, 400),
    "archer": (687, 0, 1024, 400)
}

print("Extracting heroes...")
for name, box in hero_boxes.items():
    crop = img_hp.crop(box)
    trans = make_transparent(crop, black_threshold=25, feather_range=22)
    out_path = f"public/assets/heroes/{name}.png"
    trans.save(out_path, "PNG")
    print(f" Saved {out_path} ({trans.size})")

pet_boxes = {
    "pet_dragon": (0, 400, 260, h_hp),
    "pet_fox": (260, 400, 504, h_hp),
    "pet_cat": (504, 400, 736, h_hp),
    "pet_wolf": (736, 400, 1024, h_hp)
}

print("Extracting pets...")
for name, box in pet_boxes.items():
    crop = img_hp.crop(box)
    trans = make_transparent(crop, black_threshold=25, feather_range=22)
    out_path = f"public/assets/pets/{name}.png"
    trans.save(out_path, "PNG")
    print(f" Saved {out_path} ({trans.size})")

# 2. Process Monsters (media_1793872046001.jpg)
img_mon = Image.open(os.path.join(upload_dir, "media_1793872046001.jpg"))
wm, hm = img_mon.size
row_m_bounds = [(0, 300), (300, 600), (600, hm)]
col_m_bounds = [(0, 340), (340, 680), (680, wm)]

monster_grid = [
    ["slime", "mushroom", "wolf"],
    ["bat", "spider", "golem"],
    ["king_slime", "dark_wizard", "fire_dragon"]
]

print("Extracting monsters...")
for r in range(3):
    y1, y2 = row_m_bounds[r]
    for c in range(3):
        x1, x2 = col_m_bounds[c]
        name = monster_grid[r][c]
        crop = img_mon.crop((x1, y1, x2, y2))
        trans = make_transparent(crop, black_threshold=24, feather_range=20)
        out_path = f"public/assets/monsters/{name}.png"
        trans.save(out_path, "PNG")
        print(f" Saved {out_path} ({trans.size})")

# 3. Process Items (media_1793872055933.jpg)
img_it = Image.open(os.path.join(upload_dir, "media_1793872055933.jpg"))
wi, hi = img_it.size
row_i_bounds = [(0, 247), (247, 485), (485, 722), (722, hi)]
col_i_bounds = [(0, 246), (246, 499), (499, 754), (754, wi)]

item_grid = [
    ["sword", "staff", "bow", "shield"],
    ["potion_hp", "potion_mp", "gold_coins", "mana_crystal"],
    ["chest_closed", "chest_open", "quest_scroll", "trophy"],
    ["boots", "helmet", "medal", "spellbook"]
]

print("Extracting items...")
for r in range(4):
    y1, y2 = row_i_bounds[r]
    for c in range(4):
        x1, x2 = col_i_bounds[c]
        name = item_grid[r][c]
        crop = img_it.crop((x1, y1, x2, y2))
        trans = make_transparent(crop, black_threshold=22, feather_range=18)
        out_path = f"public/assets/items/{name}.png"
        trans.save(out_path, "PNG")
        print(f" Saved {out_path} ({trans.size})")

# 4. Copy High Res World Map
world_map_src = os.path.join(upload_dir, "media_1793872039124.jpg")
world_map_dst = "public/assets/world-map.jpg"
shutil.copy2(world_map_src, world_map_dst)
print(f"Copied world map to {world_map_dst}")

# 5. Copy Battle Screen Reference
battle_src = os.path.join(upload_dir, "media_1793872063320.jpg")
battle_dst = "public/assets/battle-bg-ref.jpg"
shutil.copy2(battle_src, battle_dst)
print(f"Copied battle screen reference to {battle_dst}")

# 6. Extract the battle arena background (top 60% of battle screen reference)
battle_img = Image.open(battle_src)
wb, hb = battle_img.size
# Top part is the magical forest background
battle_arena = battle_img.crop((0, 0, wb, int(hb * 0.65)))
battle_arena.save("public/assets/battle-arena-bg.jpg", "JPEG", quality=95)
print("Saved public/assets/battle-arena-bg.jpg")

print("\n--- ALL ASSETS EXTRACTED SUCCESSFULLY! ---")
