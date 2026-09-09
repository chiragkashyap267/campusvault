"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

/**
 * Decorative particle field behind the hero.
 *
 * The naive version of this is a main-thread hog: connecting every particle to
 * every other is O(n²) per frame, and at 60 particles that is 1,770 distance
 * checks plus a separate stroke call for each drawn line, sixty times a
 * second. That is the work that shows up as scroll jank on a mid-range phone.
 *
 * This version keeps the same look but:
 *  - buckets particles into a grid so only nearby pairs are compared
 *  - batches all connection lines into a single path/stroke
 *  - scales the particle count to the viewport
 *  - stops entirely when off-screen, on a hidden tab, or under reduce-motion
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Phones and tablets never run this. Even optimised, it is a
    // requestAnimationFrame loop competing with scrolling on the one thread
    // that matters, on the exact screen a visitor lands on — and it is pure
    // decoration behind text. Desktop has the headroom to spare; a phone
    // trying to open a past paper does not.
    if (window.matchMedia("(pointer: coarse), (max-width: 1023px)").matches) return;

    let animId = 0;
    let running = false;
    let visible = true;
    // Gates startup until the idle callback fires. Without it the
    // IntersectionObserver below — which fires as soon as it observes — would
    // start the loop immediately and defeat the deferral.
    let ready = false;
    let width = 0;
    let height = 0;

    const particles: Particle[] = [];
    const CONNECTION_DISTANCE = 120;
    const CONNECTION_DISTANCE_SQ = CONNECTION_DISTANCE * CONNECTION_DISTANCE;

    // Cap device pixel ratio: on a 3x phone screen a full-bleed canvas is 9x
    // the pixels to fill, and the field is out-of-focus decoration anyway.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const particleCount = () => {
      const area = width * height;
      // Roughly one particle per 18k css px², clamped to a sane band.
      return Math.max(18, Math.min(55, Math.round(area / 18000)));
    };

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const target = particleCount();
      particles.length = 0;
      for (let i = 0; i < target; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
        });
      }
    };

    // Spatial hash: one bucket per CONNECTION_DISTANCE cell, so each particle
    // only compares against its own cell and the neighbouring ones.
    const buckets = new Map<number, number[]>();
    const cellKey = (cx: number, cy: number) => cx * 100003 + cy;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      buckets.clear();
      for (let i = 0; i < particles.length; i++) {
        const cx = Math.floor(particles[i].x / CONNECTION_DISTANCE);
        const cy = Math.floor(particles[i].y / CONNECTION_DISTANCE);
        const key = cellKey(cx, cy);
        const bucket = buckets.get(key);
        if (bucket) bucket.push(i);
        else buckets.set(key, [i]);
      }

      // All connections share one path and one stroke. Per-line alpha is
      // dropped in favour of a single mid-strength value — visually near
      // identical, and it removes a state change per line.
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const cx = Math.floor(a.x / CONNECTION_DISTANCE);
        const cy = Math.floor(a.y / CONNECTION_DISTANCE);

        for (let ox = 0; ox <= 1; ox++) {
          for (let oy = ox === 0 ? 0 : -1; oy <= 1; oy++) {
            const bucket = buckets.get(cellKey(cx + ox, cy + oy));
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i) continue; // each pair once
              const b = particles[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              if (dx * dx + dy * dy < CONNECTION_DISTANCE_SQ) {
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
              }
            }
          }
        }
      }
      ctx.strokeStyle = "rgba(0, 212, 255, 0.08)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      animId = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(animId);
    };

    const sync = () => {
      if (ready && visible && document.visibilityState === "visible") start();
      else stop();
    };

    resize();

    // Start only once the browser is idle. The hero text and buttons are what
    // the visitor came for; spending the first frames setting up a decorative
    // canvas delays them becoming interactive.
    let startHandle: number | ReturnType<typeof setTimeout>;
    const idle = (cb: () => void) =>
      "requestIdleCallback" in window
        ? (window as unknown as { requestIdleCallback: (c: () => void, o?: { timeout: number }) => number })
            .requestIdleCallback(cb, { timeout: 1200 })
        : setTimeout(cb, 300);

    startHandle = idle(() => {
      ready = true;
      sync();
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Stop burning frames once the hero is scrolled past.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    document.addEventListener("visibilitychange", sync);

    return () => {
      if ("cancelIdleCallback" in window && typeof startHandle === "number") {
        (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(startHandle);
      } else {
        clearTimeout(startHandle as ReturnType<typeof setTimeout>);
      }
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
