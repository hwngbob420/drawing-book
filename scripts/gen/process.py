"""Chuẩn hoá PNG Muse vẽ -> nét mực đen trên nền trắng, cắt sát và căn vuông (nguồn 'g:' của SceneComposer).

  python scripts/gen/process.py <vào.png> <ra.png> [--size 640]

In ra: tỉ lệ mực, số vùng trắng kín nhỏ (< 28px ở cỡ ra) và số vùng lớn, để loại ảnh hỏng.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def process(src, dst, size=800):
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    g = np.asarray(im.convert("L"), dtype=np.float32)
    # mực = phần tối: ánh xạ tuyến tính 80..200 -> 0..255 (khử xám, giữ mép mịn)
    g = np.clip((g - 60) / 160, 0, 1) * 255
    ys, xs = np.where(g < 200)
    if len(xs) == 0:
        raise SystemExit("ảnh trống")
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    crop = g[y0:y1 + 1, x0:x1 + 1]
    side = max(crop.shape)
    pad = int(side * 0.04)
    s = side + pad * 2
    out = np.full((s, s), 255, np.float32)
    oy = (s - crop.shape[0]) // 2
    ox = (s - crop.shape[1]) // 2
    out[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = crop
    img = Image.fromarray(out.astype(np.uint8)).resize((size, size), Image.LANCZOS)
    # sau phóng to: kéo tương phản lại để mép sắc nét (nét mực không bị nhoè)
    img = Image.fromarray((np.clip((np.asarray(img, np.float32) - 105) / 60, 0, 1) * 255).astype(np.uint8))
    img.save(dst, optimize=True)
    a = np.asarray(img)
    ink = (a < 128)
    lab, n = ndimage.label(~ink)
    sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    objs = ndimage.find_objects(lab)
    tiny = big = 0
    for i, sl in enumerate(objs, 1):
        if i in border:
            continue
        side_px = min(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start)
        if side_px < 28 * size / 256 * 0.5: tiny += 1
        else: big += 1
    gray = float(((a > 40) & (a < 215)).mean())
    print(f"{dst}: ink={ink.mean():.3f} regions={big} tiny={tiny} gray={gray:.3f}")

if __name__ == "__main__":
    size = 800
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--size" in sys.argv:
        size = int(sys.argv[sys.argv.index("--size") + 1]); args = [a for a in args if a != str(size)]
    process(args[0], args[1], size)
