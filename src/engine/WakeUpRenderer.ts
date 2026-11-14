import { AnimPart, AnimKind } from '../types';

/**
 * WakeUpRenderer — "Bức Tranh Thức Giấc".
 * Toàn bộ bức tranh đã tô được đưa vào một texture WebGL; fragment shader bẻ
 * cong toạ độ lấy mẫu theo các "trường chuyển động" (thở, trôi, xoay, đung đưa,
 * vỗ cánh, nhún nhảy) đặt tại vị trí từng nhân vật. Vì là phép biến dạng ngược
 * liên tục nên không cần cắt rời nhân vật và không bao giờ lộ lỗ hổng phía sau.
 * Thiết bị không có WebGL sẽ dùng canvas 2D với chuyển động nhún toàn tranh.
 */

const MAX = 16;
const KIND: Record<AnimKind, number> = { breathe: 0, drift: 1, spin: 2, sway: 3, flutter: 4, hop: 5 };

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform float uT;
uniform vec2 uSize;
uniform vec4 uA[${MAX}];
uniform vec4 uB[${MAX}];
varying vec2 vUv;
void main() {
  vec2 p = vUv * uSize;
  vec2 q = p;
  for (int i = 0; i < ${MAX}; i++) {
    vec4 a = uA[i];
    vec4 b = uB[i];
    if (a.z < 1.0) continue;
    vec2 c = a.xy;
    float dist = length((p - c) / a.zw);
    float f = 1.0 - smoothstep(0.72, 1.0, dist);
    if (f <= 0.0) continue;
    float kind = floor(b.x / 100.0 + 0.5);
    float speed = b.x - kind * 100.0;
    float ph = uT * speed + b.z;
    float s = sin(ph);
    if (kind < 0.5) {
      vec2 anchor = vec2(c.x, c.y + a.w * 0.7);
      vec2 sc = vec2(1.0 - b.y * s * 0.6, 1.0 + b.y * s);
      q += ((p - anchor) / sc - (p - anchor)) * f;
    } else if (kind < 1.5) {
      q -= vec2(b.y * s, b.y * 0.25 * cos(ph * 1.7)) * f;
    } else if (kind < 2.5) {
      float ang = -b.y * s * f;
      vec2 d = p - c;
      q += vec2(d.x * cos(ang) - d.y * sin(ang), d.x * sin(ang) + d.y * cos(ang)) - d;
    } else if (kind < 3.5) {
      float base = c.y + a.w * 0.7;
      float hgt = max(0.0, (base - p.y) / a.w);
      q.x -= b.y * s * hgt * f;
    } else if (kind < 4.5) {
      float sc = 1.0 - b.y * (0.5 + 0.5 * s);
      q.x += (p.x - c.x) * (1.0 / sc - 1.0) * f;
      q.y += 10.0 * sin(ph * 0.22) * f;
    } else {
      q.y += b.y * abs(s) * f;
    }
  }
  gl_FragColor = texture2D(uTex, q / uSize);
}`;

export class WakeUpRenderer {
  private gl: WebGLRenderingContext | null = null;
  private ctx2: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private t0 = 0;
  private uT: WebGLUniformLocation | null = null;
  private source: HTMLCanvasElement | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {}

  start(source: HTMLCanvasElement, anim: AnimPart[]) {
    this.stop();
    this.source = source;
    const ART_W = source.width;
    const ART_H = source.height;
    this.canvas.width = ART_W;
    this.canvas.height = ART_H;
    this.t0 = performance.now();
    if (!this.setupGL(source, anim)) {
      this.ctx2 = this.canvas.getContext('2d');
    }
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const t = (now - this.t0) / 1000;
      if (this.gl) {
        this.gl.uniform1f(this.uT, t);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      } else if (this.ctx2 && this.source) {
        const c = this.ctx2;
        const s = 1 + Math.sin(t * 2.4) * 0.012;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, ART_W, ART_H);
        c.translate(ART_W / 2, ART_H);
        c.scale(2 - s, s);
        c.drawImage(this.source, -ART_W / 2, -ART_H);
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  private setupGL(source: HTMLCanvasElement, anim: AnimPart[]): boolean {
    try {
      const ART_W = source.width;
      const ART_H = source.height;
      const gl = this.gl ?? (this.canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false }) as WebGLRenderingContext | null);
      if (!gl) return false;
      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
        return sh;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      const A = new Float32Array(MAX * 4);
      const B = new Float32Array(MAX * 4);
      anim.slice(0, MAX).forEach((p, i) => {
        A.set([p.cx, p.cy, p.rx, p.ry], i * 4);
        // gói loại chuyển động + tốc độ vào một số: kind*100 + speed
        B.set([KIND[p.kind] * 100 + Math.min(40, p.speed ?? 2), p.amp, p.phase ?? 0, 0], i * 4);
      });
      gl.uniform4fv(gl.getUniformLocation(prog, 'uA'), A);
      gl.uniform4fv(gl.getUniformLocation(prog, 'uB'), B);
      gl.uniform2f(gl.getUniformLocation(prog, 'uSize'), ART_W, ART_H);
      gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0);
      this.uT = gl.getUniformLocation(prog, 'uT');
      gl.viewport(0, 0, ART_W, ART_H);
      this.gl = gl;
      return true;
    } catch (e) {
      console.warn('WebGL không khả dụng, dùng chế độ 2D', e);
      this.gl = null;
      return false;
    }
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
