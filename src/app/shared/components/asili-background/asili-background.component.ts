import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';

interface FieldNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  glow: boolean;
  ph: number;
}

type Rgb = [number, number, number];

interface FieldPalette {
  teal: Rgb;
  glow: Rgb;
}

function rgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r},${g},${b},${alpha})`;
}

@Component({
  selector: 'app-asili-background',
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
  private static readonly LINK_DISTANCE_PX = 166;
  private static readonly LINK_MAX_ALPHA = 0.43;
  private static readonly NODE_FILL_ALPHA = 0.6;
  private static readonly NODE_GLOW_ALPHA = 1;
  private static readonly MOUSE_REPULSION_RADIUS_SQ = 30000;
  private static readonly WRAP_MARGIN_PX = 20;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly fieldRef = viewChild<ElementRef<HTMLCanvasElement>>('field');

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
  private teal = '#4fb3a2';
  private glow = '#5b8cff';
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }
    const canvas = this.fieldRef()?.nativeElement;
    if (!canvas) {
      return;
    }
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      return;
    }
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduce = motionQuery.matches;
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
    const onMotionChange = (event: MediaQueryListEvent): void => {
      this.reduce = event.matches;
      if (!this.reduce) {
        this.toggleLoop();
        return;
      }
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      this.renderFrame();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove', onTouch, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    motionQuery.addEventListener('change', onMotionChange);

    if (typeof IntersectionObserver !== 'undefined') {
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
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchmove', onTouch);
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotionChange);
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
    this.teal = cs.getPropertyValue('--teal').trim() || this.teal;
    this.glow = cs.getPropertyValue('--glow').trim() || this.glow;
  }

  private randomUnit(): number {
    // eslint-disable-next-line sonarjs/pseudo-random -- champ de particules decoratif : aucune valeur n'est utilisee a des fins de securite
    return Math.random();
  }

  private hexToRgb(hex: string): Rgb {
    let s = (hex || '').replace('#', '');
    if (s.length === 3) {
      s = s
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const n = parseInt(s, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  private buildNodes(): void {
    this.nodes.length = 0;
    const cap = this.w < 768 ? 46 : 80;
    const count = Math.round(Math.min(cap, Math.max(18, (this.w * this.h) / 22000)));
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: this.randomUnit() * this.w,
        y: this.randomUnit() * this.h,
        vx: (this.randomUnit() - 0.5) * 0.2,
        vy: (this.randomUnit() - 0.5) * 0.2,
        r: this.randomUnit() * 2.04 + 1.2,
        glow: this.randomUnit() < 0.14,
        ph: this.randomUnit() * Math.PI * 2,
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

    const palette: FieldPalette = {
      teal: this.hexToRgb(this.teal),
      glow: this.hexToRgb(this.glow),
    };

    this.stepNodes();
    this.drawLinks(ctx, palette);
    this.drawNodes(ctx, palette);
    ctx.shadowBlur = 0;

    if (!this.reduce && this.visible) {
      this.raf = requestAnimationFrame(() => this.renderFrame());
    }
  }

  private stepNodes(): void {
    for (const node of this.nodes) {
      if (!this.reduce) {
        this.drift(node);
        this.repelFromPointer(node);
      }
      this.wrapAroundViewport(node);
    }
  }

  private drift(node: FieldNode): void {
    node.x += node.vx + Math.sin(this.t + node.ph) * 0.05;
    node.y += node.vy + Math.cos(this.t * 0.8 + node.ph) * 0.05;
  }

  private repelFromPointer(node: FieldNode): void {
    if (!this.mouse.active) {
      return;
    }
    const radiusSq = AsiliBackgroundComponent.MOUSE_REPULSION_RADIUS_SQ;
    const dx = node.x - this.mouse.x;
    const dy = node.y - this.mouse.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq >= radiusSq) {
      return;
    }
    const force = (radiusSq - distanceSq) / radiusSq;
    const distance = Math.sqrt(distanceSq) + 1;
    node.x += (dx / distance) * force * 1.5;
    node.y += (dy / distance) * force * 1.5;
  }

  private wrapAroundViewport(node: FieldNode): void {
    const margin = AsiliBackgroundComponent.WRAP_MARGIN_PX;
    if (node.x < -margin) {
      node.x = this.w + margin;
    } else if (node.x > this.w + margin) {
      node.x = -margin;
    }
    if (node.y < -margin) {
      node.y = this.h + margin;
    } else if (node.y > this.h + margin) {
      node.y = -margin;
    }
  }

  private drawLinks(ctx: CanvasRenderingContext2D, palette: FieldPalette): void {
    const maxDistance = AsiliBackgroundComponent.LINK_DISTANCE_PX;
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= maxDistance) {
          continue;
        }
        const alpha = (1 - distance / maxDistance) * AsiliBackgroundComponent.LINK_MAX_ALPHA;
        ctx.strokeStyle = rgba(a.glow || b.glow ? palette.glow : palette.teal, alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  private drawNodes(ctx: CanvasRenderingContext2D, palette: FieldPalette): void {
    for (const node of this.nodes) {
      const color = node.glow ? palette.glow : palette.teal;
      const pulse = this.reduce ? 1 : 0.7 + Math.sin(this.t * 2 + node.ph) * 0.3;
      if (node.glow) {
        ctx.shadowColor = rgba(color, 0.9);
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = rgba(
        color,
        node.glow
          ? AsiliBackgroundComponent.NODE_GLOW_ALPHA
          : AsiliBackgroundComponent.NODE_FILL_ALPHA,
      );
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
