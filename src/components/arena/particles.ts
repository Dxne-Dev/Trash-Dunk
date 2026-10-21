export type PShape = "rect" | "dot" | "ring" | "ember";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  shape: PShape;
  grav: number;
  drag: number;
};

export class ParticleField {
  private ctx: CanvasRenderingContext2D;
  private parts: P[] = [];
  private w = 0;
  private h = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  get count() {
    return this.parts.length;
  }

  clear() {
    this.parts.length = 0;
  }

  private push(p: P) {
    if (this.parts.length > 620) this.parts.shift();
    this.parts.push(p);
  }

  confetti(x: number, y: number, n: number, colors: string[], power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (110 + Math.random() * 340) * power;
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 120 * power,
        life: 0,
        max: 0.9 + Math.random() * 0.9,
        size: 3 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 16,
        color: colors[(Math.random() * colors.length) | 0],
        shape: "rect",
        grav: 720,
        drag: 0.86,
      });
    }
  }

  sparks(x: number, y: number, n: number, color: string, speed = 260) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random());
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        max: 0.28 + Math.random() * 0.4,
        size: 1.6 + Math.random() * 2.6,
        rot: 0,
        vr: 0,
        color,
        shape: "dot",
        grav: 260,
        drag: 0.9,
      });
    }
  }

  ring(x: number, y: number, color: string, size = 14) {
    this.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0,
      max: 0.45,
      size,
      rot: 0,
      vr: 0,
      color,
      shape: "ring",
      grav: 0,
      drag: 1,
    });
  }

  trail(x: number, y: number, color: string, size = 7) {
    this.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 26,
      vy: (Math.random() - 0.5) * 26 - 18,
      life: 0,
      max: 0.34 + Math.random() * 0.3,
      size,
      rot: 0,
      vr: 0,
      color,
      shape: "ember",
      grav: -40,
      drag: 0.94,
    });
  }

  dust(x: number, y: number, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * Math.random();
      const s = 40 + Math.random() * 130;
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.4,
        life: 0,
        max: 0.5 + Math.random() * 0.5,
        size: 5 + Math.random() * 12,
        rot: 0,
        vr: 0,
        color: "rgba(238,196,145,0.5)",
        shape: "dot",
        grav: 120,
        drag: 0.9,
      });
    }
  }

  step(dt: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const list = this.parts;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += dt;
      if (p.life >= p.max) {
        list.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, Math.min(1, k));

      if (p.shape === "rect") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55);
        ctx.restore();
      } else if (p.shape === "dot") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5 * k + 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - k) * 3.4), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
