# 🎨 Sách Tô Màu Phép Thuật (Magic Coloring Book)

Ứng dụng tô màu HTML5 cho trẻ 2–8 tuổi. Lõi là **HTML5 Canvas + TypeScript thuần** (Vite chỉ dùng để bundle), không framework. Tranh mẫu được ghép từ bộ hình sách tranh tự vẽ bằng code (`scripts/storybook/`, nét `#231F20` trên nền trắng, mảng tô to cho bé 2–5 tuổi); âm thanh tổng hợp bằng Web Audio; hai thư viện nhỏ là anime.js và canvas-confetti.

## Chạy local

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # kiểm tra kiểu + đóng gói ra dist/ (static, deploy ở đâu cũng được)
npm run preview
```

## Có gì trong bản 2.0

- **Studio tràn viền**: cả màn hình là giấy vẽ `#FDFBF7`, tờ tranh nằm giữa, không khung. Hỗ trợ khổ ngang 4:3 (1600×1200) và khổ dọc 3:4 (1200×1600).
- **Điều hướng**: 1 ngón tay / chuột trái = tô. 2 ngón = phóng to (tới 4x) và kéo trang. Trên máy tính: con lăn để zoom, giữ `Space` + kéo hoặc chuột phải để dời trang. Nút khung tranh ở góc phải đưa về toàn cảnh.
- **Khay nổi**: viên thuốc ở mép dưới gồm nút công cụ, nút chất liệu và dải bút sáp. Bấm nút công cụ/chất liệu để xoè bong bóng lựa chọn. Khi bé đang tô, khay tự trượt xuống và mờ đi.
- **Xưởng Phép Thuật** (thẻ đầu tiên ở phòng tranh): chọn khổ giấy → ngôi sao chính → bạn đồng hành → không gian nền → xem trước, bấm xúc xắc để đổi bố cục, bấm *Tô màu* để vào studio. Tranh tự tạo được lưu dưới dạng "công thức" và hiện lại ở phòng tranh.

### Module mới

```
src/builder/
├── SceneDecisionTree.ts        9 nhân vật (3 nhóm) × 3 bạn đồng hành × 3 không gian nền
├── ProgressiveSceneComposer.ts svg.js đo khung bao thực, potpack xếp cụm hình, Anchor Zones ngang/dọc, chống chồng lấn
└── SceneBuilderView.ts         4 màn hình thẻ đất nặn + lời gợi ý đọc to
src/studio/
├── ViewportController.ts       panzoom (ma trận zoom/kéo) + interact.js (nhận diện cử chỉ nhiều ngón) + screenToCanvasCoords()
├── FloatingDock.ts             khay viên thuốc, bong bóng lựa chọn, tự né khi tô
└── FullBleedStudioView.ts      studio tràn viền (thay StudioView cũ)
```

Thêm nhân vật cho Xưởng: khai báo trong `SceneDecisionTree.ts` (mỗi `Hero` cần đúng 3 `companions` và 3 `backdrops`), thêm hình mới vào `scripts/storybook/*.mjs` rồi chạy `node scripts/storybook/index.mjs`. Không gian nền mới viết trong hàm `backdrop()` của `ProgressiveSceneComposer.ts`.

## Kiến trúc 4 lớp canvas (1600×1200)

| Lớp | Nội dung |
| --- | --- |
| 0 – Paper | Nền giấy kem có vân nhẹ |
| 1 – Color | Màu bé đã tô (đổ ô hoặc cọ đã khoá vùng) |
| 2 – Magic FX | `requestAnimationFrame`: sóng màu đang loang, nét cọ đang vẽ, kim tuyến lấp lánh |
| 3 – Line Art | Nét đen (nền trong suốt), luôn nằm trên cùng nên không bao giờ bị đè hay bị tẩy |

## Cấu trúc mã nguồn

```
scripts/extract-assets.mjs      Trích + làm sạch SVG từ .refs/ vào dự án
public/svg/noto|openmoji/       SVG nguồn cho tranh (tải khi mở tranh)
src/
├── main.ts                     Chuyển cảnh Gallery <-> Studio
├── types.ts                    Kiểu dữ liệu chung (Action, Paint, Artwork...)
├── assets/icons/               Icon giao diện (OpenMoji màu, đóng gói sẵn)
├── engine/
│   ├── SceneComposer.ts        Bộ ghép tranh vector: chuẩn hoá SVG, che khuất, ghép cảnh
│   ├── FloodFillEngine.ts      Scan-line flood fill, đóng khe hở, mask chống viền trắng, Smart Hit-Test
│   ├── PaintEngine.ts          Áp Action lên Layer 1 + bản đồ kim tuyến
│   ├── RippleAnimator.ts       Màu loang gợn sóng từ điểm chạm
│   ├── PatternGenerator.ts     Chất liệu: sáp dầu, kim tuyến, chấm bi, sọc, sao; nền giấy
│   ├── LineArtProcessor.ts     Tách nét đen ảnh upload (ngưỡng Otsu -> alpha)
│   ├── TimelapseRecorder.ts    Lịch sử thao tác, Undo/Redo, lịch phát Timelapse
│   └── WakeUpRenderer.ts       "Bức tranh thức giấc" (WebGL warp, có fallback 2D)
├── builder/, studio/           Xem mục "Module mới" ở trên
├── audio/SoundManager.ts       SFX Web Audio + đọc tên màu song ngữ (Web Speech)
├── data/
│   ├── BuiltInArtworks.ts      8 bức tranh = danh sách lớp SVG + nét nền
│   ├── Palette.ts              22 màu + Bút Cầu Vồng
│   └── Storage.ts              IndexedDB (tiến độ, tranh upload) + localStorage (cài đặt)
└── ui/                         GalleryView, icons, fx (anime.js + canvas-confetti), Particles, dom
```

## SceneComposer hoạt động thế nào

Với mỗi hình SVG trong một bức tranh:

1. **Chuẩn hoá**: mọi mảng thành nền trắng `#FFFFFF`, viền `#111111` dày đều theo kích thước hình, `stroke-linecap/linejoin: round`. Chi tiết nhỏ vốn tối màu (mắt, mũi) giữ mực đặc. Nét hở (`fill: none`) giữ nguyên là nét.
2. **Raster hoá** rồi đổi độ tối thành alpha, được lớp nét mực trong suốt (phần trắng trở thành giấy để tô).
3. **Che khuất**: tìm bóng của hình bằng cách loang từ mép ngoài trên bản đồ đã bịt khe, rồi xoá mọi nét phía sau bóng đó.
4. **Đóng khe hở** (trong `FloodFillEngine`, áp dụng cả cho tranh upload): co vùng tô được 3px, dán nhãn, rồi loang nhãn trở lại. Khe hẹp hơn khoảng 6px giữa các nét không làm tràn màu. Hình có nét hở rộng hơn mức đó (ví dụ bạch tuộc OpenMoji) thì không cứu được, nên đã thay bằng hình khép kín.

## Tài nguyên và giấy phép

- **Bộ hình sách tranh** (`public/svg/story/`): vẽ riêng cho dự án bằng `scripts/storybook/`. Quy trình tự render–tự phê bình học theo các skill minh hoạ trong `.claude/skills/` (MengTo/Skills, coloring-book-skill, niyam-notionaly — MIT); dáng đứng của bạn nhỏ tham khảo bộ humaaans (CC BY 4.0, Pablo Stanley) nhưng vẽ lại hoàn toàn, không dùng vector gốc.
- **Noto Emoji** © Google, Apache License 2.0 (`public/svg/noto/`): không còn dùng trong tranh mẫu, giữ lại để tương thích.
- **OpenMoji** (openmoji.org), CC BY-SA 4.0: icon giao diện (`src/assets/icons/`) và mây, bong bóng (`public/svg/openmoji/`). Giấy phép này yêu cầu ghi công và chia sẻ bản chỉnh sửa theo cùng giấy phép; lời ghi công có trong Góc phụ huynh.
- **anime.js** (MIT), **canvas-confetti** (ISC), **panzoom** (MIT), **interact.js** (MIT), **svg.js** (MIT), **potpack** (ISC): cài qua npm.
- **clay.css** (MIT): chỉ học công thức đổ bóng 3 lớp, viết lại trong `src/style.css`.

## Đã học gì từ các repo trong `.refs/`

- **q-floodfill** – thuật toán quét dòng dùng hàng đợi đoạn `[x1, x2, y, hướng]`. Viết lại trên TypedArray và chạy **một lần khi mở tranh** để dán nhãn mọi vùng kín; mỗi lần chạm chỉ còn là tra nhãn.
- **FloodFill2D** – ý tưởng `toleranceFade` và `getMask`: mask của vùng được nới 3px xuống dưới nét mực nên không còn viền trắng; mask cũng là khuôn để đổ hoạ tiết/kim tuyến và khoá cọ.
- **atrament** – làm mượt nét + ghi nét thành dữ liệu để Undo/Redo và Timelapse.
- **imagetracerjs** – tham khảo bước lượng tử hoá 2 màu cho ảnh upload.
- **clay.css** – công thức claymorphism: bóng ngoài + bóng lõm tối + bóng lõm sáng.
- **anime.js / canvas-confetti** – nảy lò xo cho nút và bút sáp; mưa sao khi hoàn thành và khi bấm Đũa Thần.

## Thao tác

- **Chạm** để đổ màu loang / tẩy ô. Chạm trúng nét đen vẫn bắt được ô gần nhất (8px màn hình, đúng ở mọi mức zoom).
- **Cọ**: giữ và di; màu bị khoá trong ô nơi ngón tay chạm xuống.
- **Ctrl+Z / Ctrl+Y** trên máy tính.
- **Nhấn giữ 2,5 giây**: nút thùng rác trong menu bánh răng (xoá tranh, vẫn Undo được), nút khoá Phụ huynh, xoá dữ liệu.
- **Đũa Thần** nằm trong vòng tròn tiến trình; menu bánh răng chứa xem lại, tải PNG, giọng đọc, âm thanh, xoá tranh.

## Thêm tranh mới

1. **Không cần code**: giữ nút khoá (Phụ huynh) ở phòng tranh 2,5 giây, rồi chọn *Tải tranh từ máy* (PNG/JPG đen trắng).
2. **Ghép từ bộ hình sách tranh**:
   - Vẽ hình mới trong `scripts/storybook/*.mjs` (`lib.<tên> = () => new Art()...`, viewBox 256, đường cong Catmull-Rom; xem quy ước đầu `engine.mjs`), rồi chạy `node scripts/storybook/index.mjs` để sinh `public/svg/story/<tên>.svg`.
   - Khai báo cảnh trong `src/data/BuiltInArtworks.ts` và thêm vào `BUILT_IN_ARTWORKS`:

```ts
const JUNGLE: SceneLayer[] = [
  { s: 's:sun', x: 1350, y: 210, size: 360, anim: 'spin' },        // lớp sau cùng
  hills(750, 965),                                                // nét nền (hàm vẽ)
  { s: 's:elephant', x: 800, y: 760, size: 700, anim: 'breathe' }, // lớp sau che lớp trước
];
scene('s-jungle', 'Rừng xanh', 'Jungle', JUNGLE);
```

`x, y` là tâm hình trên khung 1600×1200, `size` là cạnh khung vuông của hình, `rot`/`flip` để xoay/lật, `anim` (`breathe`, `drift`, `spin`, `sway`, `flutter`, `hop`) là kiểu chuyển động trong chế độ Thức Giấc. Hình có mặt (mắt, mũi) nên đặt `size` ≥ 230 để mọi mảng tô ≥ 25px.

### Kiểm tra thị giác (render headless)

Khi dev server đang chạy (`npm run dev`), cần `playwright-core` + Chromium:

```bash
node scripts/storybook/render.mjs stickers out/stickers.png   # bảng hình + lint quy chuẩn nét (fill, stroke, mảng quá nhỏ)
node scripts/storybook/render.mjs scenes out/scenes            # mỗi tranh mẫu một PNG, vùng tô < 25px khoanh đỏ
node scripts/storybook/render.mjs builder out/builder          # 27 tổ hợp của Xưởng Phép Thuật
```

Thêm `--url http://localhost:5174` nếu Vite chạy ở cổng khác, `--only a,b` để lọc, `--px 330` để phóng to bảng hình.

## Ghi chú

- Giọng đọc tiếng Việt phụ thuộc thiết bị có cài giọng `vi-VN` hay không.
- Font chữ tải từ Google Fonts; khi offline sẽ dùng font hệ thống.
