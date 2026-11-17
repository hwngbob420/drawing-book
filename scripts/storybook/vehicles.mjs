import { Art, ellipsePath, rpoly, rrect, tube, W_OUT } from './engine.mjs';
import { lib } from './shared.mjs';

// Xe cộ nhìn ngang, đầu xe quay sang PHẢI; bánh xe tiếp đất cùng một đường (y = 246).
const wheel = (a, x, r = 30) => {
  a.ell(x, 246 - r, r, r);
  a.ell(x, 246 - r, Math.max(15, r * 0.45), Math.max(15, r * 0.45), { inner: true });
};

// ---------------------------------------------------------------- tên lửa (nghiêng bay lên)
lib.rocket = () => {
  const a = new Art();
  a.group('rotate(28 128 128)', () => {
    a.spl([[104, 196], [128, 256], [152, 196], [140, 206], [128, 190], [116, 206]], { t: 0.8 }); // lửa
    a.spl([[86, 128], [44, 178], [52, 210], [90, 186]]); // vây
    a.spl([[170, 128], [212, 178], [204, 210], [166, 186]]);
    a.shape(rrect(98, 176, 60, 26, 10));
    a.spl([[128, 4], [168, 56], [174, 140], [168, 182], [88, 182], [82, 140], [88, 56]]);
    a.shape('M96 52 Q128 6 160 52 Q128 62 96 52Z', { inner: true }); // chóp
    a.ell(128, 106, 28, 28, { inner: true }); // cửa sổ
  });
  return a;
};

// ---------------------------------------------------------------- đĩa bay có bạn ngoài hành tinh
lib.ufo = () => {
  const a = new Art();
  a.line('M106 44 L96 20 M150 44 L160 20', { w: W_OUT });
  a.ell(94, 16, 14, 14);
  a.ell(162, 16, 14, 14);
  a.ell(128, 82, 44, 46); // bạn ngoài hành tinh
  a.eye(112, 74, 14);
  a.eye(144, 74, 14);
  a.smile(128, 96, 18, 5);
  a.shape('M66 120 C66 70 94 46 128 46 C162 46 190 70 190 120Z', { inner: true }); // vòm kính
  a.ell(128, 140, 122, 38);
  a.ell(128, 128, 70, 18, { inner: true });
  for (const x of [52, 128, 204]) a.ell(x, 158, 16, 12, { inner: true });
  a.spl([[92, 172], [164, 172], [150, 196], [106, 196]]);
  return a;
};

// ---------------------------------------------------------------- xe cứu hoả
lib.firetruck = () => {
  const a = new Art();
  a.shape(rrect(10, 104, 176, 104, 14));
  a.shape(rpoly([[176, 208], [176, 66], [210, 66], [248, 128], [248, 208]], 14)); // cabin
  a.shape(rpoly([[188, 80], [206, 80], [230, 126], [188, 126]], 8), { inner: true }); // kính
  a.shape(rrect(190, 44, 30, 24, 8)); // còi hụ
  a.shape(rrect(18, 72, 160, 30, 10)); // thang
  for (const x of [58, 98, 138]) a.line(`M${x} 74 V100`);
  a.ell(80, 156, 30, 30, { inner: true }); // cuộn vòi
  a.shape(rrect(124, 130, 40, 50, 10), { inner: true }); // cửa tủ
  wheel(a, 62, 34);
  wheel(a, 200, 34);
  return a;
};

// ---------------------------------------------------------------- ô tô con
lib.car = () => {
  const a = new Art();
  a.shape('M40 116 C52 70 84 56 124 56 C162 56 182 72 196 116Z'); // nóc
  a.shape('M60 112 C68 84 88 74 116 74 V112Z', { inner: true });
  a.shape('M132 74 C156 74 170 86 178 112 H132Z', { inner: true });
  a.shape(rrect(10, 108, 236, 90, 30));
  a.ell(226, 136, 14, 14, { inner: true }); // đèn
  a.line('M126 116 V180');
  wheel(a, 64, 34);
  wheel(a, 190, 34);
  return a;
};

// ---------------------------------------------------------------- tàu hoả hơi nước
lib.train = () => {
  const a = new Art();
  a.shape('M152 40 C134 40 132 14 152 12 C158 -4 186 -2 190 14 C210 12 214 40 194 40 Z'); // khói
  a.shape(rrect(152, 50, 36, 52, 8)); // ống khói
  a.shape(rpoly([[230, 214], [252, 214], [252, 236], [222, 236]], 6)); // gạt đá
  a.shape(rrect(96, 96, 144, 104, 26)); // nồi hơi
  a.shape(rrect(8, 52, 102, 152, 14)); // buồng lái
  a.shape(rrect(0, 40, 118, 26, 10)); // mái
  a.shape(rrect(28, 84, 60, 50, 12), { inner: true });
  a.shape(rrect(4, 196, 244, 22, 10));
  wheel(a, 44, 30);
  wheel(a, 128, 26);
  wheel(a, 200, 26);
  return a;
};

// ---------------------------------------------------------------- trực thăng
lib.helicopter = () => {
  const a = new Art();
  a.shape(rrect(30, 28, 196, 18, 9)); // cánh quạt
  a.shape(rrect(114, 40, 30, 30, 8));
  a.spl(tube([[150, 132], [204, 120], [240, 108]], [42, 26, 20])); // đuôi
  a.ell(236, 98, 18, 30);
  a.spl([[62, 120], [80, 74], [140, 64], [184, 92], [190, 150], [150, 184], [80, 184], [56, 160]]);
  a.shape('M70 120 C72 96 92 82 126 82 V126 H72Z', { inner: true });
  a.line('M86 184 V214 M156 184 V214', { w: W_OUT });
  a.shape(rrect(44, 208, 150, 18, 9));
  return a;
};

// ---------------------------------------------------------------- máy bay cánh quạt
lib.plane = () => {
  const a = new Art();
  a.spl([[40, 120], [12, 50], [42, 48], [78, 108]]); // đuôi đứng
  a.spl([[110, 128], [160, 128], [126, 214], [96, 212]]); // cánh phía xa
  a.spl(tube([[30, 124], [100, 128], [190, 130]], [44, 70, 74]));
  a.shape('M190 96 C220 98 232 114 232 132 C232 150 220 164 190 166Z');
  a.ell(240, 130, 10, 46); // cánh quạt
  a.ell(118, 116, 16, 16, { inner: true });
  a.ell(160, 116, 16, 16, { inner: true });
  return a;
};

// ---------------------------------------------------------------- tàu thuỷ
lib.ship = () => {
  const a = new Art();
  a.shape(rrect(150, 40, 40, 70, 10)); // ống khói
  a.shape('M144 44 C150 20 186 18 196 40Z', { inner: true });
  a.shape(rrect(60, 92, 150, 70, 14)); // ca bin
  for (const x of [96, 140]) a.ell(x, 126, 18, 18, { inner: true });
  a.shape('M8 156 H248 C240 210 206 236 128 236 C50 236 16 210 8 156Z'); // thân tàu
  a.line('M20 186 H236');
  return a;
};

// ---------------------------------------------------------------- đèn giao thông & biển báo
lib.trafficlight = () => {
  const a = new Art();
  a.shape(rrect(112, 170, 32, 76, 8));
  a.shape(rrect(80, 232, 96, 20, 9));
  a.shape(rrect(74, 6, 108, 176, 26));
  for (const y of [42, 94, 146]) a.ell(128, y, 26, 24, { inner: true });
  return a;
};

lib.stopsign = () => {
  const a = new Art();
  a.shape(rrect(114, 150, 28, 98, 8));
  const oct = Array.from({ length: 8 }, (_, i) => {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    return [128 + Math.cos(ang) * 92, 92 + Math.sin(ang) * 92];
  });
  a.shape(rpoly(oct, 12));
  a.shape(rpoly(oct.map(([x, y]) => [128 + (x - 128) * 0.74, 92 + (y - 92) * 0.74]), 10), { inner: true });
  return a;
};
