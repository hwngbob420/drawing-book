"""Xử lý mọi ảnh thô trong out/hub/raw -> public/gen/<tên>.png và dựng bảng xem nhanh out/hub/sheet.png."""
import glob, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from process import process
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.makedirs(f"{root}/public/gen", exist_ok=True)
names = []
for f in sorted(glob.glob(f"{root}/out/hub/raw/*")):
    name = os.path.basename(f).split("__", 1)[1].rsplit(".", 1)[0]
    tmp = f"{root}/out/hub/_t.png"
    Image.open(f).convert("RGB").save(tmp)
    process(tmp, f"{root}/public/gen/{name}.png")
    names.append(name)
cols = 6
cell = 220
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * cell), "white")
for i, n in enumerate(names):
    im = Image.open(f"{root}/public/gen/{n}.png").resize((cell - 10, cell - 10))
    sheet.paste(im, ((i % cols) * cell + 5, (i // cols) * cell + 5))
sheet.save(f"{root}/out/hub/sheet.png")
print(len(names), "hình")
