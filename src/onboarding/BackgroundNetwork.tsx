/**
 * Social Gravity — Project Aurora: Animated Background Network
 * Lightweight, 60 FPS decorative social network canvas with floating particles,
 * dynamic edge conduits, and subtle ambient cluster glows.
 * Automatically adapts to Light and Dark themes.
 */

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../ui/theme/ThemeProvider';

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  cluster: number;
}

const CLUSTER_COLORS_DARK = [
  '#4F8CFF', // Primary Blue
  '#00F0FF', // Cyan Curiosity
  '#10B981', // Joy Green
  '#A855F7', // Insight Purple
  '#F59E0B', // Caution Amber
];

const CLUSTER_COLORS_LIGHT = [
  '#2563EB', // Primary Blue
  '#0891B2', // Cyan
  '#059669', // Green
  '#7C3AED', // Purple
  '#D97706', // Amber
];

export const BackgroundNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize 36 floating nodes
    const colors = isLight ? CLUSTER_COLORS_LIGHT : CLUSTER_COLORS_DARK;
    const nodeCount = 38;
    const nodes: ParticleNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const cluster = i % colors.length;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.2 + 1.8,
        color: colors[cluster],
        cluster,
      });
    }

    // Ambient glow centers that drift slowly
    const glows = [
      { x: width * 0.25, y: height * 0.35, vx: 0.15, vy: 0.1, radius: 280, color: isLight ? 'rgba(37,99,235,0.04)' : 'rgba(79,140,255,0.06)' },
      { x: width * 0.75, y: height * 0.65, vx: -0.12, vy: 0.14, radius: 320, color: isLight ? 'rgba(8,145,178,0.035)' : 'rgba(0,240,255,0.05)' },
      { x: width * 0.5, y: height * 0.8, vx: 0.08, vy: -0.12, radius: 250, color: isLight ? 'rgba(124,58,237,0.03)' : 'rgba(168,85,247,0.045)' },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw ambient radial glows
      for (const g of glows) {
        g.x += g.vx;
        g.y += g.vy;
        if (g.x < 50 || g.x > width - 50) g.vx *= -1;
        if (g.y < 50 || g.y > height - 50) g.vy *= -1;

        const radial = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
        radial.addColorStop(0, g.color);
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Update node positions with edge wrapping
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -20) node.x = width + 20;
        else if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        else if (node.y > height + 20) node.y = -20;
      }

      // 3. Draw inter-node connecting conduits
      const maxDistance = 140;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (isLight ? 0.22 : 0.28);
            const edgeColor = nodes[i].cluster === nodes[j].cluster ? nodes[i].color : (isLight ? '#64748B' : '#94A3B8');

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = edgeColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = nodes[i].cluster === nodes[j].cluster ? 1.0 : 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      // 4. Draw nodes & node halos
      for (const node of nodes) {
        // Node halo
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = isLight ? 0.12 : 0.18;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Core node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
    />
  );
};
