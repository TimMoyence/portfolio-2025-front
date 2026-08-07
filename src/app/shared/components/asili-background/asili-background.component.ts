import { isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  viewChild,
} from "@angular/core";

interface FieldNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  glow: boolean;
  ph: number;
}

/**
 * Fond vivant global Asili : canvas fixe d'un champ de particules/données
 * qui dérive en continu et réagit au curseur. Client-only (rien en SSR),
 * densité allégée sur mobile, pause hors-écran, frame statique en
 * `prefers-reduced-motion`. Couleurs lues depuis les variables CSS (--teal/--glow).
 */
@Component({
  selector: "app-asili-background",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (isBrowser) {
    <canvas #field class="asili-field" aria-hidden="true"></canvas>
  }`,
  styles: `
    .asili-field {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: -2;
      pointer-events: none;
    }
  `,
})
export class AsiliBackgroundComponent implements AfterViewInit {
  /** Distance max de liaison entre deux noeuds (px). */
  private static readonly LINK = 166;
  /** Opacite max d'un trait de liaison (a distance nulle). */
  private static readonly LINK_ALPHA = 0.43;
  /** Opacite de remplissage d'un noeud standard / d'un noeud « glow ». */
  private static readonly NODE_ALPHA = 0.6;
  private static readonly NODE_GLOW_ALPHA = 1;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly fieldRef = viewChild<ElementRef<HTMLCanvasElement>>("field");

  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private readonly nodes: FieldNode[] = [];
  private readonly mouse = { x: -9999, y: -9999, active: false };
  private raf = 0;
  private t = 0;
  private reduce = false;
  private visible = true;
  private teal = "#4fb3a2";
  private glow = "#5b8cff";
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }
    const canvas = this.fieldRef()?.nativeElement;
    if (!canvas) {
      return;
    }
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) {
      return;
    }
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.readColors();
    this.resize();

    const onResize = (): void => {
      this.resize();
      if (this.reduce) {
        this.renderFrame();
      }
    };
    const onMove = (e: MouseEvent): void => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    };
    const onLeave = (): void => {
      this.mouse.active = false;
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    };
    const onTouch = (e: TouchEvent): void => {
      const touch = e.touches[0];
      if (touch) {
        this.mouse.x = touch.clientX;
        this.mouse.y = touch.clientY;
        this.mouse.active = true;
      }
    };
    const onVisibility = (): void => {
      this.visible = !document.hidden;
      this.toggleLoop();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    if (typeof IntersectionObserver !== "undefined") {
      this.observer = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        this.toggleLoop();
      });
      this.observer.observe(canvas);
    }

    if (this.reduce) {
      this.renderFrame();
    } else {
      this.start();
    }

    this.destroyRef.onDestroy(() => {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      document.removeEventListener("visibilitychange", onVisibility);
      this.observer?.disconnect();
    });
  }

  private start(): void {
    if (!this.raf) {
      this.raf = requestAnimationFrame(() => this.renderFrame());
    }
  }

  private toggleLoop(): void {
    if (this.reduce) {
      return;
    }
    if (this.visible) {
      this.start();
    } else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private readColors(): void {
    const cs = getComputedStyle(document.documentElement);
    this.teal = cs.getPropertyValue("--teal").trim() || this.teal;
    this.glow = cs.getPropertyValue("--glow").trim() || this.glow;
  }

  private hexToRgb(hex: string): [number, number, number] {
    let s = (hex || "").replace("#", "");
    if (s.length === 3) {
      s = s
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const n = parseInt(s, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  private buildNodes(): void {
    this.nodes.length = 0;
    const cap = this.w < 768 ? 46 : 80;
    const count = Math.round(
      Math.min(cap, Math.max(18, (this.w * this.h) / 22000)),
    );
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 2.04 + 1.2,
        glow: Math.random() < 0.14,
        ph: Math.random() * Math.PI * 2,
      });
    }
  }

  private resize(): void {
    const canvas = this.fieldRef()?.nativeElement;
    if (!canvas || !this.ctx) {
      return;
    }
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    canvas.width = this.w * this.dpr;
    canvas.height = this.h * this.dpr;
    canvas.style.width = `${this.w}px`;
    canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.buildNodes();
  }

  private renderFrame(): void {
    this.raf = 0;
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    this.t += 0.004;
    ctx.clearRect(0, 0, this.w, this.h);
    const teal = this.hexToRgb(this.teal);
    const glow = this.hexToRgb(this.glow);

    for (const n of this.nodes) {
      if (!this.reduce) {
        n.x += n.vx + Math.sin(this.t + n.ph) * 0.05;
        n.y += n.vy + Math.cos(this.t * 0.8 + n.ph) * 0.05;
        if (this.mouse.active) {
          const dx = n.x - this.mouse.x;
          const dy = n.y - this.mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 30000) {
            const f = (30000 - d2) / 30000;
            const dist = Math.sqrt(d2) + 1;
            n.x += (dx / dist) * f * 1.5;
            n.y += (dy / dist) * f * 1.5;
          }
        }
      }
      if (n.x < -20) {
        n.x = this.w + 20;
      }
      if (n.x > this.w + 20) {
        n.x = -20;
      }
      if (n.y < -20) {
        n.y = this.h + 20;
      }
      if (n.y > this.h + 20) {
        n.y = -20;
      }
    }

    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < AsiliBackgroundComponent.LINK) {
          const o =
            (1 - d / AsiliBackgroundComponent.LINK) *
            AsiliBackgroundComponent.LINK_ALPHA;
          const c = a.glow || b.glow ? glow : teal;
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${o})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of this.nodes) {
      const c = n.glow ? glow : teal;
      const pulse = this.reduce ? 1 : 0.7 + Math.sin(this.t * 2 + n.ph) * 0.3;
      if (n.glow) {
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowBlur = 0;
      }
      const alpha = n.glow
        ? AsiliBackgroundComponent.NODE_GLOW_ALPHA
        : AsiliBackgroundComponent.NODE_ALPHA;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (!this.reduce && this.visible) {
      this.raf = requestAnimationFrame(() => this.renderFrame());
    }
  }
}
