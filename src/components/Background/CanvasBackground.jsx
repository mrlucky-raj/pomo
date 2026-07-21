import React, { useEffect, useRef } from 'react';

export default function CanvasBackground({ type }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;
    let lastFrameTime = performance.now();
    const targetFps = 30; // Cap at 30 FPS for buttery smooth, low-CPU rendering
    const frameInterval = 1000 / targetFps;

    const resize = () => {
      canvas.width = Math.min(window.innerWidth, 1920);
      canvas.height = Math.min(window.innerHeight, 1080);
    };
    resize();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 150);
    };
    window.addEventListener('resize', handleResize);

    if (type === 'canvas_rain') {
      const numDrops = 80; // Optimized particle count for 60fps low-spec performance
      const drops = Array.from({ length: numDrops }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 18 + 8,
        speed: Math.random() * 6 + 3,
        opacity: Math.random() * 0.35 + 0.1,
      }));

      const render = (now) => {
        animationFrameId = requestAnimationFrame(render);
        const delta = now - lastFrameTime;
        if (delta < frameInterval) return;
        lastFrameTime = now - (delta % frameInterval);

        ctx.fillStyle = 'rgba(10, 15, 30, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drops.forEach(d => {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 1, d.y + d.len);
          ctx.stroke();

          d.y += d.speed;
          d.x -= 0.5;
          if (d.y > canvas.height) {
            d.y = -20;
            d.x = Math.random() * canvas.width;
          }
        });
      };
      animationFrameId = requestAnimationFrame(render);
    } else if (type === 'canvas_stars') {
      const numStars = 100; // Fast star particles without heavy shadow blur
      const stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.015 + 0.005,
        direction: Math.random() > 0.5 ? 1 : -1,
      }));

      const render = (now) => {
        animationFrameId = requestAnimationFrame(render);
        const delta = now - lastFrameTime;
        if (delta < frameInterval) return;
        lastFrameTime = now - (delta % frameInterval);

        ctx.fillStyle = '#050814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
          s.alpha += s.speed * s.direction;
          if (s.alpha >= 1 || s.alpha <= 0.1) {
            s.direction *= -1;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
          ctx.fill();
        });
      };
      animationFrameId = requestAnimationFrame(render);
    } else if (type === 'canvas_fog') {
      let time = 0;
      const render = (now) => {
        animationFrameId = requestAnimationFrame(render);
        const delta = now - lastFrameTime;
        if (delta < frameInterval) return;
        lastFrameTime = now - (delta % frameInterval);

        time += 0.005;
        ctx.fillStyle = '#09101d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.12)');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;

          ctx.moveTo(0, canvas.height);
          for (let x = 0; x <= canvas.width; x += 30) {
            const y = canvas.height * 0.6 + Math.sin(x * 0.003 + time + i) * 50;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();
          ctx.fill();
        }
      };
      animationFrameId = requestAnimationFrame(render);
    } else {
      let step = 0;
      const render = (now) => {
        animationFrameId = requestAnimationFrame(render);
        const delta = now - lastFrameTime;
        if (delta < frameInterval) return;
        lastFrameTime = now - (delta % frameInterval);

        step += 0.003;
        const color1 = `hsl(${Math.sin(step) * 30 + 150}, 40%, 10%)`;
        const color2 = `hsl(${Math.cos(step) * 30 + 220}, 40%, 8%)`;

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [type]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
