# アプリのアイコン（icon-180/192/512.png）を作り直すスクリプト
# 使い方: python make_icon.py   （要: pip install pillow）
import math, pathlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = pathlib.Path(__file__).parent
S = 1024

def font(size):
    for name in ["BIZ-UDGothicB.ttc", "meiryob.ttc", "arialbd.ttf"]:
        try:
            return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
        except OSError:
            continue
    return ImageFont.load_default()

def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)

img = Image.new("RGB", (S, S))
top, mid, bot = (226, 208, 255), (203, 230, 255), (255, 214, 238)
px = img.load()
for y in range(S):
    t = y / (S - 1)
    c = [int(top[i] + (mid[i] - top[i]) * t * 2) if t < .5 else int(mid[i] + (bot[i] - mid[i]) * (t - .5) * 2) for i in range(3)]
    for x in range(S):
        px[x, y] = tuple(c)

d = ImageDraw.Draw(img)
# 虹のアーチ
for i, col in enumerate([(255, 170, 210), (255, 225, 150), (180, 235, 210), (170, 215, 255), (205, 180, 255)]):
    r = 430 - i * 38
    d.arc([S / 2 - r, 640 - r, S / 2 + r, 640 + r], 180, 360, fill=col, width=38)
# きらきら
for (x, y, r) in [(170, 170, 46), (860, 210, 36), (120, 520, 28), (900, 560, 40), (520, 120, 26)]:
    star(d, x, y, r, (255, 255, 255))

# 数字 1 2 3（白いふち＋色）
f = font(330)
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
items = [("1", 230, (178, 120, 255)), ("2", 512, (90, 165, 245)), ("3", 794, (255, 110, 185))]
for ch, x, col in items:
    gd.text((x, 640), ch, font=f, anchor="mm", fill=(255, 255, 255, 255), stroke_width=34, stroke_fill=(255, 255, 255, 255))
img.paste(glow.filter(ImageFilter.GaussianBlur(6)), (0, 0), glow.filter(ImageFilter.GaussianBlur(6)))
d = ImageDraw.Draw(img)
for ch, x, col in items:
    d.text((x, 640), ch, font=f, anchor="mm", fill=col, stroke_width=22, stroke_fill=(255, 255, 255))
# ハート
d.ellipse([440, 840, 512, 912], fill=(255, 140, 200)); d.ellipse([512, 840, 584, 912], fill=(255, 140, 200))
d.polygon([(446, 892), (578, 892), (512, 960)], fill=(255, 140, 200))

for size in (512, 192, 180):
    img.resize((size, size), Image.LANCZOS).save(HERE / f"icon-{size}.png")
print("ok")
