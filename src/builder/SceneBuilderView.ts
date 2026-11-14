import { Artwork, Orient, makeCanvas, ctx2d } from '../types';
import { svgUrl, composeScene } from '../engine/SceneComposer';
import { PAPER } from '../engine/PatternGenerator';
import { sound } from '../audio/SoundManager';
import { Storage } from '../data/Storage';
import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { boing, flyIn, starRain } from '../ui/fx';
import { BACKDROPS, BackdropId, Hero, Piece, heroTrio } from './SceneDecisionTree';
import { Recipe, buildScene, recipeToArtwork } from './ProgressiveSceneComposer';

const ROT_KEY = 'mcb-builder-rot';

/**
 * SceneBuilderView — Xưởng Phép Thuật: 4 màn hình nối tiếp
 * (khổ giấy -> ngôi sao chính -> bạn đồng hành -> không gian nền -> xem trước).
 * Mỗi màn hình chỉ có các thẻ đất nặn lớn với hình minh hoạ; lời gợi ý được đọc to.
 */
export class SceneBuilderView {
  readonly el: HTMLElement;
  private body: HTMLElement;
  private dots: HTMLElement;
  private step = 0;
  private orient: Orient = 'l';
  private hero: Hero | null = null;
  private comp: Piece | null = null;
  private bg: BackdropId | null = null;
  private seed = (Date.now() % 100000) + 1;
  private rotation: number;
  private token = 0;

  constructor(
    private onDone: (art: Artwork) => void,
    private onExit: () => void,
  ) {
    let rot = 0;
    try {
      rot = Number(localStorage.getItem(ROT_KEY) || '0') || 0;
      localStorage.setItem(ROT_KEY, String(rot + 1)); // lần mở sau sẽ ra bộ nhân vật khác
    } catch {}
    this.rotation = rot;
    const back = h('button', { class: 'ibtn clay c-blue', 'aria-label': 'Quay lại', title: 'Quay lại' }, icon('back'));
    back.addEventListener('click', () => {
      sound.unlock();
      sound.click();
      boing(back);
      if (this.step === 0) {
        sound.stopSpeech();
        this.onExit();
      } else this.go(this.step - 1);
    });
    this.dots = h('div', { class: 'steps' });
    this.body = h('div', { class: 'b-body' });
    this.el = h('div', { class: 'builder' }, h('header', {}, back, this.dots, h('span', { class: 'b-wand' }, icon('wand'))), this.body);
    this.go(0);
  }

  private go(step: number) {
    this.step = step;
    this.token++;
    this.dots.replaceChildren(...[0, 1, 2, 3, 4].map((i) => h('i', { class: i === step ? 'on' : i < step ? 'done' : '' })));
    this.body.className = 'b-body s' + step;
    if (step === 0) this.stepOrient();
    else if (step === 1) this.stepHero();
    else if (step === 2) this.stepComp();
    else if (step === 3) this.stepBackdrop();
    else void this.stepPreview();
  }

  private card(content: Node[], label: string, tint: string, pick: () => void, cls = ''): HTMLButtonElement {
    const b = h('button', { class: 'b-card clay ' + cls, style: `--clay:${tint}`, 'aria-label': label }, h('div', { class: 'b-art' }, ...content), h('span', { class: 'b-label' }, label));
    b.addEventListener('click', () => {
      sound.unlock();
      sound.pop();
      sound.say(label);
      boing(b);
      setTimeout(pick, 230);
    });
    return b;
  }

  private img(src: string, cls = ''): HTMLImageElement {
    return h('img', { src: svgUrl(src), alt: '', draggable: 'false', class: cls });
  }

  /** Hình minh hoạ của một mảnh ghép: hình chính to, các hình phụ nhỏ hơn bên cạnh. */
  private pieceArt(p: Piece): Node[] {
    const out: Node[] = [];
    p.svgs.slice(0, 3).forEach((sv, i) => {
      const wrap = h('span', { class: 'pa pa' + i + ' n' + Math.min(3, p.svgs.length) }, this.img(sv.s));
      if (sv.hat) wrap.append(this.img(sv.hat.s, 'hat'));
      out.push(wrap);
    });
    return out;
  }

  // ---------------------------------------------------------------- Bước 0: khổ giấy
  private stepOrient() {
    sound.say('Con chọn tờ giấy nằm ngang hay đứng?');
    const paper = (o: Orient, a: string, b: string) => h('span', { class: 'paper ' + o }, this.img(a), this.img(b));
    this.body.replaceChildren(
      this.card([paper('l', 'n:1f31e', 'n:1f42c')], 'Giấy ngang', '#ffe9a8', () => this.pickOrient('l'), 'wide'),
      this.card([paper('p', 'n:1f680', 'n:1f3f0')], 'Giấy đứng', '#c9ecff', () => this.pickOrient('p'), 'wide'),
    );
  }
  private pickOrient(o: Orient) {
    this.orient = o;
    this.go(1);
  }

  // ---------------------------------------------------------------- Bước 1: ngôi sao chính
  private stepHero() {
    sound.say('Con thích bạn nào nhất?');
    const tints = ['#c9ecff', '#ffd0e4', '#d6f5c6'];
    const cards = heroTrio(this.rotation).map((hero, i) =>
      this.card(this.pieceArt(hero), hero.vi, tints[i], () => {
        this.hero = hero;
        this.go(2);
      }),
    );
    const dice = h('button', { class: 'ibtn clay c-yellow b-dice', 'aria-label': 'Đổi bộ nhân vật khác', title: 'Đổi bộ nhân vật khác' }, icon('dice'));
    dice.addEventListener('click', () => {
      sound.click();
      this.rotation++;
      this.stepHero();
    });
    this.body.replaceChildren(...cards, dice);
  }

  // ---------------------------------------------------------------- Bước 2: bạn đồng hành
  private stepComp() {
    sound.say(`${this.hero!.vi} đi chơi cùng ai nhỉ?`);
    const tints = ['#ffe9a8', '#d9d2ff', '#ffd6c2'];
    this.body.replaceChildren(
      ...this.hero!.companions.map((c, i) =>
        this.card(this.pieceArt(c), c.vi, tints[i], () => {
          this.comp = c;
          this.go(3);
        }),
      ),
    );
  }

  // ---------------------------------------------------------------- Bước 3: không gian nền
  private stepBackdrop() {
    sound.say('Mình đi chơi ở đâu?');
    this.body.replaceChildren(
      ...this.hero!.backdrops.map((id) =>
        this.card([h('span', { class: 'pa pa0 n1' }, this.img(BACKDROPS[id].icon))], BACKDROPS[id].vi, BACKDROPS[id].tint, () => {
          this.bg = id;
          this.go(4);
        }),
      ),
    );
  }

  // ---------------------------------------------------------------- Bước 4: xem trước & lắp ráp
  private recipe(): Recipe {
    return { orient: this.orient, hero: this.hero!.id, comp: this.comp!.id, bg: this.bg!, seed: this.seed };
  }

  private async stepPreview() {
    const token = this.token;
    sound.say('Phép thuật đang ghép tranh!');
    // 3 biểu tượng bay vào giữa màn hình + pháo sao
    const trio = h('div', { class: 'b-trio' });
    const srcs = [this.hero!.svgs[0].s, this.comp!.svgs[0].s, BACKDROPS[this.bg!].icon];
    srcs.forEach((s, i) => {
      const chip = h('span', { class: 'b-chip clay' }, this.img(s));
      trio.append(chip);
      flyIn(chip, (i - 1) * 260, 320, i * 120);
    });
    const frame = h('div', { class: 'b-preview ' + this.orient });
    const dice = h('button', { class: 'ibtn clay c-yellow big', 'aria-label': 'Xúc xắc đổi vị trí', title: 'Xúc xắc đổi vị trí' }, icon('dice'));
    const start = h('button', { class: 'b-start clay', 'aria-label': 'Bắt đầu tô màu' }, icon('play'), h('span', {}, 'Tô màu'));
    const actions = h('div', { class: 'b-actions' }, dice, start);
    this.body.replaceChildren(trio, frame, actions);
    starRain(1);
    sound.chime();

    const render = async () => {
      frame.classList.add('busy');
      const scene = await buildScene(this.recipe());
      const line = await composeScene(scene.layers, scene.w, scene.h);
      if (token !== this.token) return;
      const c = makeCanvas(scene.w / 2, scene.h / 2);
      const x = ctx2d(c);
      x.fillStyle = PAPER;
      x.fillRect(0, 0, c.width, c.height);
      x.imageSmoothingQuality = 'high';
      x.drawImage(line, 0, 0, c.width, c.height);
      frame.replaceChildren(c);
      frame.classList.remove('busy');
      boing(frame);
    };
    dice.addEventListener('click', () => {
      sound.click();
      boing(dice);
      this.seed = (this.seed * 31 + 17) % 99991;
      void render();
    });
    start.addEventListener('click', async () => {
      sound.unlock();
      sound.pop();
      boing(start);
      const id = 'custom-' + Date.now().toString(36);
      const recipe = this.recipe();
      await Storage.saveCustom({ id, recipe, created: Date.now() });
      sound.stopSpeech();
      this.onDone(recipeToArtwork(id, recipe));
    });
    await render();
  }
}
