import { Art, spline, mirror, ellipsePath, deg, polar, rpoly, rrect, arcPts, starPts, tube, W_OUT } from './engine.mjs';
import { lib } from './shared.mjs';

// ---------------------------------------------------------------- công trình
lib.house = () => {
  const a = new Art();
  a.shape(rrect(170, 36, 30, 58, 6));
  a.shape(rrect(34, 106, 188, 136, 14));
  a.shape(rpoly([[16, 118], [128, 26], [240, 118]], 16));
  a.ell(128, 82, 20, 20, { inner: true });
  a.shape('M102 242 V178 Q102 156 124 156 H132 Q154 156 154 178 V242Z');
  a.ink(ellipsePath(142, 202, 4.5, 4.5));
  a.shape(rrect(50, 134, 40, 42, 10), { inner: true });
  a.shape(rrect(166, 134, 40, 42, 10), { inner: true });
  return a;
};

lib.castle = () => {
  const a = new Art();
  const tower = (x) => {
    a.shape(rrect(x, 112, 54, 130, 8));
    a.shape(rpoly([[x - 8, 118], [x + 27, 44], [x + 62, 118]], 10));
    a.shape('M' + (x + 14) + ' 168 Q' + (x + 14) + ' 146 ' + (x + 27) + ' 146 Q' + (x + 40) + ' 146 ' + (x + 40) + ' 168 V190 H' + (x + 14) + 'Z', { inner: true });
  };
  tower(10);
  tower(192);
  a.shape(rrect(76, 78, 104, 164, 8));
  a.shape(rpoly([[66, 86], [128, 12], [190, 86]], 12));
  a.shape('M104 242 V190 Q104 164 128 164 Q152 164 152 190 V242Z');
  a.shape('M112 130 Q112 106 128 106 Q144 106 144 130 V146 H112Z', { inner: true });
    a.line('M37 46 V8', { w: W_OUT });
  a.shape(rpoly([[37, 8], [72, 22], [37, 36]], 5), { inner: true });
  return a;
};

lib.building = () => {
  const a = new Art();
  a.shape(rrect(44, 22, 168, 22, 8));
  a.shape(rrect(52, 40, 152, 206, 10));
  for (const y of [58, 100, 142]) for (const x of [66, 110, 154]) a.shape(rrect(x, y, 36, 30, 8), { inner: true });
  a.shape('M106 246 V198 Q106 184 128 184 Q150 184 150 198 V246Z');
  return a;
};

// ---------------------------------------------------------------- bánh kẹo
lib.cake = () => {
  const a = new Art();
  const drip = (x0, x1, y) => `M${x0} ${y + 10} Q${x0} ${y} ${x0 + 14} ${y} H${x1 - 14} Q${x1} ${y} ${x1} ${y + 10} V${y + 22} Q${x1 - 14} ${y + 40} ${x1 - 28} ${y + 22} Q${(x0 + x1) / 2 + 6} ${y + 46} ${(x0 + x1) / 2 - 18} ${y + 22} Q${x0 + 40} ${y + 40} ${x0 + 24} ${y + 22} Q${x0 + 10} ${y + 34} ${x0} ${y + 22}Z`;
  a.shape(rrect(16, 222, 224, 22, 11));
  a.shape(rrect(30, 140, 196, 86, 16));
  a.shape(drip(30, 226, 132));
  a.shape(rrect(66, 90, 124, 54, 14));
  a.shape(drip(66, 190, 82));
  for (const x of [92, 164]) {
    a.shape(rrect(x - 11, 48, 22, 40, 6), { inner: true });
    a.shape(`M${x} 6 Q${x + 18} 28 ${x} 46 Q${x - 18} 28 ${x} 6Z`, { inner: true });
  }
  return a;
};

lib.icecream = () => {
  const a = new Art();
  a.shape(rpoly([[84, 146], [172, 146], [128, 248]], 10));
  a.line('M100 168 L124 210');
  a.line('M156 168 L132 210');
  a.shape('M56 142 C48 102 88 86 128 86 C168 86 208 102 200 142 Q190 158 176 144 Q162 160 148 144 Q134 160 120 144 Q106 160 92 144 Q76 156 56 142Z');
  a.ell(128, 68, 46, 44);
  a.ell(128, 24, 18, 18, { inner: true });
  return a;
};

lib.cupcake = () => {
  const a = new Art();
  a.shape(rpoly([[56, 150], [200, 150], [178, 246], [78, 246]], 10));
  a.line('M100 154 L102 242');
  a.line('M156 154 L154 242');
  a.ell(128, 134, 86, 34);
  a.ell(128, 98, 62, 30);
  a.ell(128, 66, 38, 26);
  a.ell(128, 34, 18, 18, { inner: true });
  return a;
};

lib.donut = () => {
  const a = new Art();
  a.ell(128, 140, 112, 88);
  a.shape('M30 132 C30 74 70 52 128 52 C186 52 226 74 226 132 C226 152 214 162 204 152 C196 172 180 166 174 154 C164 168 146 162 142 152 C130 170 110 164 108 150 C96 166 78 160 74 150 C60 164 44 160 40 150 C32 154 30 144 30 132Z');
  a.ell(128, 116, 32, 22, { inner: true });
  for (const [x, y, r] of [[66, 92, 0.6], [92, 74, -0.8], [164, 74, 0.7], [190, 96, -0.5], [186, 130, 0.9], [72, 130, -0.7]]) {
    a.line(`M${x - 7 * Math.cos(r)} ${y - 7 * Math.sin(r)} L${x + 7 * Math.cos(r)} ${y + 7 * Math.sin(r)}`, { w: W_OUT });
  }
  return a;
};

lib.lollipop = () => {
  const a = new Art();
  a.shape(rrect(116, 150, 24, 100, 10));
  a.ell(128, 100, 90, 90);
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const ang = t * 2.6 * Math.PI * 2 - Math.PI / 2;
    const r = 8 + t * 74;
    pts.push([128 + Math.cos(ang) * r, 100 + Math.sin(ang) * r]);
  }
  a.line(spline(pts.filter((_, i) => i % 3 === 0), false), { w: W_OUT });
  return a;
};

lib.candy = () => {
  const a = new Art();
  const end = [[74, 118], [28, 76], [14, 128], [28, 180], [74, 138]];
  a.spl(end, { t: 0.8 });
  a.spl(mirror(end), { t: 0.8 });
  a.ell(128, 128, 62, 46);
  a.line('M100 90 Q108 128 100 166');
  a.line('M156 90 Q148 128 156 166');
  return a;
};

lib.strawberry = () => {
  const a = new Art();
  a.spl([[128, 70], [186, 60], [220, 102], [198, 172], [128, 246], [58, 172], [36, 102], [70, 60]]);
  for (const [x, y] of [[96, 112], [160, 112], [128, 146], [88, 164], [168, 164], [128, 200], [108, 130]]) a.ink(ellipsePath(x, y, 4.5, 7));
  a.shape(rrect(118, 14, 20, 40, 6), { inner: true });
  a.spl([[128, 62], [160, 38], [194, 58], [170, 78], [194, 96], [150, 90], [128, 112], [106, 90], [62, 96], [86, 78], [62, 58], [96, 38]], { t: 0.7 });
  return a;
};

lib.cherries = () => {
  const a = new Art();
  a.line('M88 132 Q104 68 142 34', { w: W_OUT });
  a.line('M172 140 Q162 68 142 34', { w: W_OUT });
  a.spl([[142, 34], [186, 16], [226, 36], [196, 62], [156, 52]]);
  a.ell(88, 184, 54, 54);
  a.ell(172, 190, 52, 52);
  a.line('M62 168 Q66 150 82 146', { w: W_OUT });
  a.line('M148 176 Q152 160 166 156', { w: W_OUT });
  return a;
};

lib.balloon = () => {
  const a = new Art();
  a.line('M128 194 Q108 214 128 230 Q148 246 128 254');
  a.spl([[128, 14], [182, 38], [198, 96], [172, 148], [128, 174], [84, 148], [58, 96], [74, 38]]);
  a.line('M92 52 Q74 70 74 98');
  return a;
};

// ---------------------------------------------------------------- đồ chơi
lib.bone = () => {
  const a = new Art();
  a.shape('M72 100 C72 62 28 66 30 100 C12 104 12 148 30 152 C28 186 72 190 72 152 H184 C184 190 228 186 226 152 C244 148 244 104 226 100 C228 66 184 62 184 100Z');
  return a;
};

lib.ball = () => {
  const a = new Art();
  a.ell(128, 128, 106, 106);
  for (let i = 0; i < 5; i++) {
    const ang = deg(i * 72 - 90);
    const [x0, y0] = polar(128, 128, 40, ang);
    const [x1, y1] = polar(128, 128, 102, ang);
    a.line(`M${x0} ${y0} L${x1} ${y1}`, { w: W_OUT });
  }
  a.shape(rpoly(Array.from({ length: 5 }, (_, i) => polar(128, 128, 44, deg(i * 72 - 90))), 8));
  return a;
};

lib.yarn = () => {
  const a = new Art();
  a.line('M64 190 Q28 222 58 240 Q80 250 98 238', { w: W_OUT });
  a.ell(128, 128, 94, 94);
  const p = (ang) => polar(128, 128, 94, deg(ang));
  const chord = (a0, a1, cy) => `M${p(a0).join(' ')} Q128 ${cy} ${p(a1).join(' ')}`;
  a.line(chord(205, 335, 110));
  a.line(chord(170, 10, 168));
  a.line(chord(140, 40, 222));
  return a;
};

lib.crown = () => {
  const a = new Art();
  a.shape(rpoly([[42, 196], [30, 82], [86, 130], [128, 54], [170, 130], [226, 82], [214, 196]], 12));
  a.shape(rrect(40, 168, 176, 40, 10));
  a.ell(32, 74, 19, 19, { inner: true });
  a.ell(128, 46, 20, 20, { inner: true });
  a.ell(224, 74, 19, 19, { inner: true });
  return a;
};

lib.helmet = () => {
  const a = new Art();
  a.shape('M26 176 C26 84 72 44 128 44 C184 44 230 84 230 176Z');
  a.shape(rrect(110, 30, 36, 146, 14), { inner: true });
  a.shape(rrect(8, 168, 240, 36, 16));
  a.ell(128, 112, 28, 28, { inner: true });
  return a;
};

lib.wand = () => {
  const a = new Art();
  a.spl(tube([[34, 238], [92, 178], [140, 128]], [26, 26, 24]));
  a.spl(starPts(172, 84, 70, 38), { t: 0.55 });
  a.eye(158, 82, 11);
  a.eye(186, 82, 11);
  a.smile(172, 100, 18, 5);
  return a;
};

lib.pumpkin = () => {
  const a = new Art();
  a.ell(78, 128, 48, 76);
  a.ell(178, 128, 48, 76);
  a.ell(128, 126, 58, 82);
  a.shape(rrect(116, 30, 24, 36, 6), { inner: true });
  a.shape('M104 186 V150 Q104 118 128 118 Q152 118 152 150 V186Z', { inner: true });
  a.ell(70, 216, 28, 28);
  a.ell(186, 216, 28, 28);
  return a;
};

