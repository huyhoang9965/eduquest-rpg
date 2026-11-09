import os
from PIL import Image

upload_dir = r"C:\Users\asus\.gemini\antigravity\brain\afe4a535-cc3b-4d0a-b801-bd1f00fc7d86\.user_uploaded"

im_mon = Image.open(os.path.join(upload_dir, "media_1793872046001.jpg"))
wm, hm = im_mon.size
row_m = [sum(sum(im_mon.getpixel((x, y))) for x in range(0, wm, 8)) for y in range(hm)]
my1 = min(range(260, 360), key=lambda y: row_m[y])
my2 = min(range(580, 680), key=lambda y: row_m[y])
print(f"Monsters Y cuts at y={my1} (val {row_m[my1]}), y={my2} (val {row_m[my2]})")

col_m = [sum(sum(im_mon.getpixel((x, y))) for y in range(0, hm, 8)) for x in range(wm)]
mx1 = min(range(290, 390), key=lambda x: col_m[x])
mx2 = min(range(630, 730), key=lambda x: col_m[x])
print(f"Monsters X cuts at x={mx1} (val {col_m[mx1]}), x={mx2} (val {col_m[mx2]})")

im_it = Image.open(os.path.join(upload_dir, "media_1793872055933.jpg"))
wi, hi = im_it.size
row_i = [sum(sum(im_it.getpixel((x, y))) for x in range(0, wi, 8)) for y in range(hi)]
iy1 = min(range(210, 290), key=lambda y: row_i[y])
iy2 = min(range(460, 540), key=lambda y: row_i[y])
iy3 = min(range(700, 790), key=lambda y: row_i[y])
print(f"Items Y cuts at y={iy1} (val {row_i[iy1]}), y={iy2} (val {row_i[iy2]}), y={iy3} (val {row_i[iy3]})")

col_i = [sum(sum(im_it.getpixel((x, y))) for y in range(0, hi, 8)) for x in range(wi)]
ix1 = min(range(210, 290), key=lambda x: col_i[x])
ix2 = min(range(470, 550), key=lambda x: col_i[x])
ix3 = min(range(720, 800), key=lambda x: col_i[x])
print(f"Items X cuts at x={ix1} (val {col_i[ix1]}), x={ix2} (val {col_i[ix2]}), x={ix3} (val {col_i[ix3]})")
