import { Art, deg, polar, tube } from './engine.mjs';
import { lib } from './shared.mjs';

// ---------------------------------------------------------------- thiên nhiên

lib.sun = () => {
  const a = new Art();
  // tia nắng = cánh tròn lớn, ít (8) để mỗi tia là một ô to
  for (let i = 0; i < 8; i++) {
    const ang = deg(i * 45 + 22);
    const [x, y] = polar(128, 128, 96, ang);
    a.ell(x, y, 20, 26, { rot: ang + Math.PI / 2 });
  }
  a.ell(128, 128, 74, 74);
  a.eye(106, 118, 15);
  a.eye(150, 118, 15);
  a.smile(128, 146, 34, 8);
  return a;
};

lib.cloud = () => {
  const a = new Art();
  // đáy phẳng, đỉnh bồng bềnh 3 búi
  a.shape('M50 184 C18 184 14 144 46 136 C42 100 86 86 108 108 C120 72 174 72 184 112 C220 104 244 142 216 168 C226 184 214 186 200 184 Z');
  a.happyEye(108, 140, 9);
  a.happyEye(150, 140, 9);
  a.smile(129, 156, 22, 6);
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
