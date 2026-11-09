import os
from PIL import Image

upload_dir = r"C:\Users\asus\.gemini\antigravity\brain\afe4a535-cc3b-4d0a-b801-bd1f00fc7d86\.user_uploaded"
im1 = Image.open(os.path.join(upload_dir, "media_1793872051009.jpg"))
w, h = im1.size

# Check col brightness for heroes (y: 20 to 390)
col_h = [sum(sum(im1.getpixel((x, y))) for y in range(20, 390, 4)) for x in range(w)]
# Find valleys between 3 heroes (e.g. around 300-380 and 640-720)
v1 = min(range(300, 380), key=lambda x: col_h[x])
v2 = min(range(640, 720), key=lambda x: col_h[x])
print(f"Heroes cuts at x={v1} (val {col_h[v1]}), x={v2} (val {col_h[v2]})")

# Check col brightness for pets (y: 410 to 670)
col_p = [sum(sum(im1.getpixel((x, y))) for y in range(410, 670, 4)) for x in range(w)]
# 4 pets -> 3 cuts (e.g. around 220-280, 480-540, 740-800)
p1 = min(range(210, 290), key=lambda x: col_p[x])
p2 = min(range(470, 550), key=lambda x: col_p[x])
p3 = min(range(720, 800), key=lambda x: col_p[x])
print(f"Pets cuts at x={p1} (val {col_p[p1]}), x={p2} (val {col_p[p2]}), x={p3} (val {col_p[p3]})")
