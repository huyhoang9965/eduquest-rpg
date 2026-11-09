import os
from PIL import Image

upload_dir = r"C:\Users\asus\.gemini\antigravity\brain\afe4a535-cc3b-4d0a-b801-bd1f00fc7d86\.user_uploaded"

im1 = Image.open(os.path.join(upload_dir, "media_1793872051009.jpg"))
w, h = im1.size

# Let's check row brightness to see where heroes end and pets begin
row_b = [sum(sum(im1.getpixel((x, y))) for x in range(0, w, 8)) for y in range(h)]
# Find local minima in row_b between y=300 and y=450
min_y = min(range(320, 430), key=lambda y: row_b[y])
print(f"Heroes / Pets split around y={min_y}, val={row_b[min_y]}")

# Let's inspect heroes row (y from 0 to min_y)
# Let's find 3 heroes columns
col_b_heroes = [sum(sum(im1.getpixel((x, y))) for y in range(20, min_y, 4)) for x in range(w)]
# Let's inspect pets row (y from min_y to h)
col_b_pets = [sum(sum(im1.getpixel((x, y))) for y in range(min_y, h, 4)) for x in range(w)]

# Save thumbnail slices to verify
os.makedirs("public/assets/heroes", exist_ok=True)
os.makedirs("public/assets/pets", exist_ok=True)
os.makedirs("public/assets/monsters", exist_ok=True)
os.makedirs("public/assets/items", exist_ok=True)
os.makedirs("public/assets/ui", exist_ok=True)
print("Created asset dirs.")
