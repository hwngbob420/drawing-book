# Tranh thả vào (public/artworks)

Thả file SVG màu bất kỳ (xuất từ vtracer, công cụ AI, hoạ sĩ...) vào thư mục này rồi khai báo trong `manifest.json`:

```json
{ "artworks": [ { "id": "ten-tranh", "file": "ten-tranh.svg", "title": "Tên hiện ở phòng tranh", "version": 1, "orient": "l" } ] }
```

- `id`: chữ, số, `-` hoặc `_`; giữ cố định cho mỗi tranh.
- `version`: tăng khi thay file mới cùng `id` (tiến độ tô theo nét cũ sẽ được bỏ).
- `orient`: `"l"` khổ ngang 4:3 (mặc định) hoặc `"p"` khổ dọc 3:4.
- `minPart` (tuỳ chọn): bỏ mảng nhỏ hơn ngưỡng này, tính bằng px trên tranh 1600 (mặc định 22).

**Dùng vtracer**: chọn chế độ `cutout` (các mảng không chồng nhau) để nét đen của tranh gốc thành một nét duy nhất.
Ở chế độ mặc định `stacked`, viền đen bị vẽ thành một khối đặc nằm dưới các mảng màu và sau khi chuyển sẽ thành
một rãnh đôi hẹp khó tô.

```bash
vtracer --input tranh.png --output tranh.svg --colormode color --hierarchical cutout --mode spline --filter_speckle 4
```

Ứng dụng tự chuyển tranh thành nét tô màu khi mở (`src/engine/SvgLineArtConverter.ts`): mảng màu thành nền trắng,
nét `#231F20` (viền ngoài dày, nét trong mảnh), bỏ chi tiết nhỏ, lấp khe hẹp. Tranh vtracer quá nhiều hình được
giới hạn 3000 hình lớn nhất. Sau khi thêm tranh, chạy lại `npm run build:single` nếu dùng bản một file.

Hai tranh mẫu `gopher-whale.svg`, `gopher-panda.svg`: Free Gophers Pack © Maria Letta, CC0 1.0
(https://github.com/MariaLetta/free-gophers-pack).
