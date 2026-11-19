import { Art, deg, polar, rpoly, rrect, arcPts, starPts, tube, W_OUT } from './engine.mjs';
import { lib } from './shared.mjs';

lib.star = () => {
  const a = new Art();
  a.spl(starPts(128, 136, 116, 64), { t: 0.55 });
  a.eye(108, 130, 13);
  a.eye(148, 130, 13);
  a.smile(128, 158, 22, 5);
  return a;
};

/** Ngôi sao trơn (lấp lánh trên trời) — không mặt để đứng nhỏ vẫn sạch. */
lib.twinkle = () => {
  const a = new Art();
  a.spl(starPts(128, 136, 118, 62), { t: 0.5 });
  return a;
};

lib.moon = () => {
  const a = new Art();
  a.shape('M176 20 C96 28 48 92 66 164 C84 228 154 252 224 226 C150 214 122 160 138 104 C146 72 160 44 176 20Z');
  return a;
};

lib.rainbow = () => {
  const a = new Art();
  const band = (r) => a.shape(`M${128 - r} 214 A${r} ${r} 0 0 1 ${128 + r} 214 Z`);
  band(122);
  band(92);
  band(62);
  return a;
};

lib.bubble = () => {
  const a = new Art();
  a.ell(128, 128, 104, 104);
  a.line('M66 112 Q74 72 112 56', { w: W_OUT });
  return a;
};

lib.mushroom = () => {
  const a = new Art();
  a.spl([[86, 166], [82, 214], [100, 244], [156, 244], [174, 214], [170, 166]]);
  a.eye(110, 204, 13);
  a.eye(146, 204, 13);
  a.smile(128, 226, 20, 5);
  a.shape('M16 150 C16 70 84 26 128 26 C178 26 240 70 240 150 C240 176 200 184 128 184 C56 184 16 176 16 150Z');
  a.ell(80, 110, 30, 28, { inner: true });
  a.ell(170, 92, 32, 30, { inner: true });
  return a;
};

lib.volcano = () => {
  const a = new Art();
  a.shape('M86 66 C66 66 64 40 84 36 C88 14 120 10 128 30 C140 12 172 18 168 42 C186 46 184 70 166 68 Z'); // khói một đám
  a.shape('M4 248 C36 206 64 120 96 90 L160 90 C192 120 220 206 252 248Z');
  a.shape('M86 98 Q128 72 170 98 L180 124 Q156 112 152 144 Q142 168 128 134 Q114 170 104 132 Q96 112 76 124Z');
  a.eye(108, 196, 15);
  a.eye(150, 196, 15);
  a.smile(130, 222, 30, 7);
  return a;
};

lib.planet = () => {
  const a = new Art();
  const rot = -0.35;
  a.ell(128, 134, 122, 38, { rot });
  a.ell(128, 128, 76, 76);
  a.line('M64 98 Q128 120 192 98');
  const outer = arcPts(128, 134, 122, 38, 0.05, Math.PI - 0.05, 14, rot);
  const inner = arcPts(128, 134, 84, 18, 0.05, Math.PI - 0.05, 14, rot).reverse();
  a.spl([...outer, ...inner], { t: 0.8 });
  return a;
};

lib.earth = () => {
  const a = new Art();
  a.ell(128, 128, 108, 108);
  a.spl([[68, 60], [116, 42], [154, 64], [136, 106], [92, 112], [56, 98]]);
  a.spl([[150, 138], [200, 122], [218, 160], [188, 208], [148, 190]]);
  a.spl([[42, 146], [86, 136], [96, 180], [66, 204], [40, 184]]);
  return a;
};

lib.coral = () => {
  const a = new Art();
  a.spl(tube([[128, 246], [128, 180], [128, 120], [124, 50]], [60, 46, 42, 38]));
  a.spl(tube([[116, 192], [84, 168], [60, 130], [54, 88]], [40, 38, 36, 34]));
  a.spl(tube([[140, 172], [176, 150], [198, 110], [202, 72]], [40, 38, 36, 34]));
  a.ell(128, 232, 80, 22);
  return a;
};

/** Rong biển: ba dải lượn sóng to bản. */
lib.seaweed = () => {
  const a = new Art();
  a.spl(tube([[92, 250], [72, 200], [98, 150], [74, 100], [92, 52]], [36, 34, 32, 30, 26]));
  a.spl(tube([[166, 250], [188, 196], [160, 140], [184, 84]], [36, 34, 30, 26]));
  a.spl(tube([[128, 252], [118, 200], [138, 150], [122, 104], [136, 20]], [40, 38, 34, 30, 26]));
  return a;
};

lib.shell = () => {
  const a = new Art();
  a.shape('M128 238 C58 222 18 162 32 112 C56 58 98 34 128 34 C158 34 200 58 224 112 C238 162 198 222 128 238Z');
  a.line('M128 224 L84 60');
  a.line('M128 224 L172 60');
  a.shape(rrect(96, 218, 64, 28, 12));
  return a;
};

lib.pine = () => {
  const a = new Art();
  a.shape(rrect(106, 196, 44, 54, 10));
  a.shape(rpoly([[128, 20], [204, 112], [52, 112]], 22));
  a.shape(rpoly([[128, 64], [222, 164], [34, 164]], 24));
  a.shape(rpoly([[128, 112], [240, 212], [16, 212]], 26));
  return a;
};

lib.palm = () => {
  const a = new Art();
  a.spl(tube([[104, 252], [116, 190], [132, 130], [128, 84]], [46, 38, 32, 28]));
  a.line('M94 214 Q122 222 140 208');
  a.line('M104 164 Q126 172 142 160');
  const leaf = (ang, len) => {
    const p = (r, o) => [128 + Math.cos(ang) * r - Math.sin(ang) * o, 84 + Math.sin(ang) * r + Math.cos(ang) * o];
    return [p(0, 0), p(len * 0.3, -26), p(len * 0.75, -28), p(len, 6), p(len * 0.7, 20), p(len * 0.3, 22)];
  };
  for (const [ang, len] of [[deg(200), 114], [deg(-20), 114], [deg(250), 100], [deg(-70), 100], [deg(155), 86], [deg(25), 86]]) a.spl(leaf(ang, len), { t: 0.9 });
  a.ell(112, 104, 20, 20);
  a.ell(146, 106, 20, 20);
  return a;
};

lib.tulip = () => {
  const a = new Art();
  a.spl([[132, 238], [94, 206], [64, 196], [80, 230], [124, 246]]);
  a.spl([[124, 220], [164, 186], [196, 178], [182, 214], [132, 236]]);
  a.spl(tube([[128, 130], [126, 190], [128, 250]], [18, 18, 18]));
  a.shape('M62 54 C58 112 80 148 128 150 C176 148 198 112 194 54 C178 72 164 76 154 56 C148 38 136 32 128 32 C120 32 108 38 102 56 C92 76 78 72 62 54Z');
  a.line('M102 56 C112 90 112 120 114 146');
  a.line('M154 56 C144 90 144 120 142 146');
  return a;
};

lib.sunflower = () => {
  const a = new Art();
  a.spl([[124, 230], [168, 204], [200, 212], [178, 242], [130, 248]]);
  a.spl(tube([[128, 150], [126, 200], [128, 252]], [18, 18, 18]));
  for (let i = 0; i < 8; i++) {
    const ang = deg(i * 45 - 90);
    const [x, y] = polar(128, 100, 70, ang);
    a.ell(x, y, 22, 34, { rot: ang + Math.PI / 2 });
  }
  a.ell(128, 100, 48, 48);
  a.eye(112, 94, 12);
  a.eye(144, 94, 12);
  a.smile(128, 116, 20, 5);
  return a;
};

lib.wave = () => {
  const a = new Art();
  a.shape('M8 216 C8 150 52 98 112 90 C150 86 176 54 164 22 C208 36 240 82 242 130 C243 160 238 190 246 216Z');
  a.line('M84 192 C68 150 96 114 128 116 C154 118 162 142 148 160');
  return a;
};

lib.bamboo = () => {
  const a = new Art();
  // lá vẽ trước, thân đè lên: lá mọc ngang ra khỏi mép thân (không cắt chéo thân -> không có khe nhọn)
  a.spl([[140, 92], [182, 70], [232, 76], [196, 106], [140, 110]]);
  a.spl([[56, 160], [20, 140], [6, 170], [36, 186], [60, 180]]);
  const stalk = (x, top, w) => {
    a.shape(rrect(x - w / 2, top, w, 252 - top, 12));
    for (let y = top + 66; y < 228; y += 66) a.line(`M${x - w / 2 + 1} ${y} H${x + w / 2 - 1}`);
  };
  stalk(66, 40, 40);
  stalk(130, 10, 42);
  stalk(194, 56, 40);
  return a;
};

/** Bụi cỏ tròn (nền cho đồng cỏ, rừng). */
lib.bush = () => {
  const a = new Art();
  a.shape('M28 214 C2 214 6 168 38 166 C34 126 84 108 108 132 C118 96 176 96 184 134 C214 116 254 146 232 178 C254 190 246 214 226 214 Z');
  a.ell(96, 168, 18, 18, { inner: true });
  return a;
};

/** Hòn đá tròn. */
lib.rock = () => {
  const a = new Art();
  a.shape('M24 210 C20 160 60 116 112 112 C150 110 168 124 188 136 C226 150 238 186 232 210 Z');
  a.line('M134 136 Q150 148 154 170');
  return a;
};
