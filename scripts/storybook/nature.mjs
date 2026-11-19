import { Art, deg, polar, tube } from './engine.mjs';
import { lib } from './shared.mjs';

// ---------------------------------------------------------------- thiên nhiên

// Mặt trời, mây: không vẽ mặt — nền sách tranh phải tĩnh, nhường chỗ cho nhân vật.
lib.sun = () => {
  const a = new Art();
  // tia nắng = cánh tròn lớn, ít (8) để mỗi tia là một ô to
  for (let i = 0; i < 8; i++) {
    const ang = deg(i * 45 + 22);
    const [x, y] = polar(128, 128, 96, ang);
    a.ell(x, y, 20, 26, { rot: ang + Math.PI / 2 });
  }
  a.ell(128, 128, 74, 74);
  return a;
};

// Ba dáng mây đáy phẳng khác nhau để hai đám mây trong một tranh không bao giờ giống hệt nhau.
lib.cloud = () => {
  const a = new Art();
  a.shape('M50 184 C18 184 14 144 46 136 C42 100 86 86 108 108 C120 72 174 72 184 112 C220 104 244 142 216 168 C226 184 214 186 200 184 Z');
  return a;
};
lib.cloud2 = () => {
  const a = new Art();
  a.shape('M34 176 C8 176 10 142 38 140 C40 118 70 108 88 122 C100 96 140 94 152 118 C164 100 196 104 200 128 C232 124 250 152 230 170 C236 178 228 178 220 176 Z');
  return a;
};
lib.cloud3 = () => {
  const a = new Art();
  a.shape('M70 170 C40 170 36 136 66 128 C70 92 124 80 140 112 C160 96 196 112 190 140 C214 144 214 170 192 170 Z');
  return a;
};

lib.tree = () => {
  const a = new Art();
  a.spl([[110, 252], [114, 196], [106, 150], [150, 150], [142, 196], [148, 252]]);
  // tán cây: 3 búi lớn, hai quả táo lệch chéo (không xếp thành "mặt")
  a.shape('M60 162 C18 158 14 100 50 90 C44 42 112 20 138 52 C170 26 226 60 206 104 C242 118 228 170 190 162 C168 182 88 182 60 162 Z');
  a.ell(92, 104, 22, 22, { inner: true });
  a.ell(172, 136, 22, 22, { inner: true });
  return a;
};

/** Cây tán tròn một khối, thân hơi nghiêng. */
lib.tree2 = () => {
  const a = new Art();
  a.spl([[116, 252], [122, 200], [130, 150], [154, 152], [148, 204], [150, 252]]);
  a.ell(132, 104, 92, 84);
  return a;
};
/** Cây cao hai tầng tán. */
lib.tree3 = () => {
  const a = new Art();
  a.spl([[114, 252], [118, 190], [116, 120], [140, 120], [138, 190], [144, 252]]);
  a.shape('M64 150 C34 146 36 104 66 98 C66 66 108 58 124 80 C140 54 190 66 186 104 C214 112 210 150 180 150 C160 166 92 166 64 150 Z');
  a.shape('M84 84 C64 80 66 48 90 44 C94 18 132 12 142 36 C162 22 190 40 178 64 C192 76 180 96 160 90 C144 102 104 100 84 84 Z');
  return a;
};

lib.flower = () => {
  const a = new Art();
  a.spl([[124, 230], [164, 206], [198, 212], [174, 240], [130, 244]]);
  a.spl(tube([[128, 140], [126, 196], [128, 252]], [18, 18, 18]));
  for (let i = 0; i < 5; i++) {
    const ang = deg(i * 72 + 90); // một cánh chĩa thẳng xuống che đầu cuống: không có khe giữa cánh và cuống
    const [x, y] = polar(128, 98, 46, ang);
    a.ell(x, y, 32, 38, { rot: ang + Math.PI / 2 });
  }
  a.ell(128, 98, 28, 28);
  return a;
};
