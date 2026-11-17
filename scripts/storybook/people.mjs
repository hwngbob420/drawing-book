import { Art, mirror, ellipsePath, rpoly, rrect, starPts, tube, W_OUT } from './engine.mjs';
import { lib } from './shared.mjs';

// Bạn nhỏ kiểu chibi: đầu ~45% chiều cao, thân ngắn, tay chân tròn mập, giày to.
// (Tư thế tham khảo dáng đứng/vẫy tay của bộ người phẳng humaaans — vẽ lại hoàn toàn, không dùng vector gốc.)

function kidBody(a, { dress = false, wave = true } = {}) {
  // chân + giày
  a.spl(tube([[110, 190], [106, 236]], [30, 28]));
  a.spl(tube([[146, 190], [152, 236]], [30, 28]));
  a.ell(100, 242, 26, 13);
  a.ell(158, 242, 26, 13);
  if (dress) a.spl([[96, 138], [160, 138], [192, 214], [128, 222], [64, 214]], { t: 0.8 });
  else {
    a.spl([[86, 184], [170, 184], [176, 216], [134, 220], [128, 206], [122, 220], [80, 216]], { t: 0.8 }); // quần short
    a.spl([[128, 128], [164, 136], [176, 168], [172, 196], [128, 202], [84, 196], [80, 168], [92, 136]]); // áo
  }
  // tay vẽ đè lên áo, chếch ra ngoài (không chạy song song mép áo -> không tạo khe hẹp)
  a.spl(tube([[100, 146], [70, 168], [54, 190]], [28, 26, 24]));
  a.ell(50, 198, 17, 17);
  if (wave) {
    a.spl(tube([[156, 146], [192, 122], [204, 90]], [28, 26, 24]));
    a.ell(206, 80, 17, 17);
  } else {
    a.spl(tube([[156, 146], [186, 168], [202, 190]], [28, 26, 24]));
    a.ell(206, 198, 17, 17);
  }
}
function kidFace(a) {
  a.ell(128, 76, 60, 56);
}
function kidEyes(a) {
  a.eye(106, 86, 15);
  a.eye(150, 86, 15);
  a.line('M114 108 Q128 122 142 108', { w: 3 });
}

lib.kid_boy = () => {
  const a = new Art();
  kidBody(a);
  kidFace(a);
  a.spl([[66, 84], [68, 40], [104, 14], [154, 14], [190, 40], [190, 84], [178, 60], [150, 54], [116, 62], [84, 56]], { t: 0.8 }); // tóc mái lệch
  kidEyes(a);
  return a;
};

lib.kid_girl = () => {
  const a = new Art();
  a.ell(58, 58, 28, 28); // hai búi tóc
  a.ell(198, 58, 28, 28);
  kidBody(a, { dress: true });
  kidFace(a);
  a.spl([[66, 96], [66, 40], [104, 14], [152, 14], [190, 40], [190, 96], [176, 60], [128, 54], [80, 60]], { t: 0.8 });
  kidEyes(a);
  return a;
};

// ---------------------------------------------------------------- nàng tiên nhí
lib.fairy = () => {
  const a = new Art();
  const wing = [[110, 132], [52, 72], [12, 96], [22, 150], [100, 160]];
  const low = [[110, 160], [54, 176], [44, 222], [98, 206]];
  a.spl(wing);
  a.spl(mirror(wing));
  a.spl(low);
  a.spl(mirror(low));
  // đũa phép trong tay vẫy
  a.spl(tube([[206, 96], [226, 40]], [12, 12]));
  a.spl(starPts(228, 30, 26, 14), { t: 0.5 });
  a.ell(128, 20, 24, 22); // búi tóc
  kidBody(a, { dress: true });
  kidFace(a);
  a.spl([[68, 80], [70, 36], [108, 18], [150, 18], [186, 36], [188, 80], [172, 56], [128, 46], [84, 56]], { t: 0.85 });
  kidEyes(a);
  return a;
};

// ---------------------------------------------------------------- phi hành gia nhí
lib.astronaut = () => {
  const a = new Art();
  a.shape(rrect(70, 120, 116, 82, 18)); // ba lô
  a.spl(tube([[110, 196], [104, 232]], [34, 32]));
  a.spl(tube([[146, 196], [154, 232]], [34, 32]));
  a.shape(rrect(74, 224, 52, 26, 12));
  a.shape(rrect(132, 224, 52, 26, 12));
  a.spl(tube([[90, 148], [60, 130], [44, 100]], [32, 30, 28]));
  a.ell(42, 92, 19, 19);
  a.spl(tube([[166, 148], [196, 170], [210, 200]], [32, 30, 28]));
  a.ell(212, 208, 19, 19);
  a.spl([[128, 126], [168, 134], [180, 172], [174, 208], [128, 214], [82, 208], [76, 172], [88, 134]]);
  a.shape(rrect(104, 152, 48, 34, 10), { inner: true }); // bảng điều khiển ngực
  a.ell(128, 76, 66, 62); // mũ bảo hiểm
  a.shape('M76 70 C76 40 100 32 128 32 C156 32 180 40 180 70 C180 104 158 116 128 116 C98 116 76 104 76 70Z', { inner: true }); // kính mũ = khuôn mặt
  a.eye(108, 72, 15);
  a.eye(148, 72, 15);
  a.line('M114 94 Q128 106 142 94', { w: 3 });

  return a;
};
