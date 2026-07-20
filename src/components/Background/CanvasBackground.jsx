import React, { useEffect, useRef } from 'react';

export default function CanvasBackground({ type }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (type === 'canvas_rain') {
      // Animated Rain Drops
      const numDrops = 160;
      const drops = Array.from({ length: numDrops }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 20 + 10,
        speed: Math.random() * 8 + 4,
        opacity: Math.random() * 0.4 + 0.1,
      }));

      const render = () => {
        ctx.fillStyle = 'rgba(10, 15, 30, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drops.forEach(d => {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity})`;
          ctx.lineWidth = 1.5;
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

        animationFrameId = requestAnimationFrame(render);
      };
      render();
    } else if (type === 'canvas_stars') {
      // Starry Night & Floating Dust
      const numStars = 200;
      const stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.2,
        alpha: Math.random(),
        speed: Math.random() * 0.015 + 0.005,
        direction: Math.random() > 0.5 ? 1 : -1,
      }));

      const render = () => {
        ctx.fillStyle = '#050814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle gradient background
        const bgGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 50,
          canvas.width / 2, canvas.height / 2, canvas.width / 1.2
        );
        bgGradient.addColorStop(0, 'rgba(20, 35, 60, 0.4)');
        bgGradient.addColorStop(1, 'rgba(5, 8, 20, 1)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
          s.alpha += s.speed * s.direction;
          if (s.alpha >= 1 || s.alpha <= 0.1) {
            s.direction *= -1;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
          ctx.shadowBlur = s.radius > 1.2 ? 6 : 0;
          ctx.shadowColor = '#ffffff';
          ctx.fill();
        });

        animationFrameId = requestAnimationFrame(render);
      };
      render();
    } else if (type === 'canvas_fog') {
      // Floating Forest Mist Waves
      let time = 0;
      const render = () => {
        time += 0.005;
        ctx.fillStyle = '#09101d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
          gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;

          ctx.moveTo(0, canvas.height);
          for (let x = 0; x <= canvas.width; x += 20) {
            const y = canvas.height * 0.6 +
              Math.sin(x * 0.003 + time + i) * 60 +
              Math.cos(x * 0.008 - time * 0.5) * 30;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();
          ctx.fill();
        }

        animationFrameId = requestAnimationFrame(render);
      };
      render();
    } else {
      // Default Gradient Waves
      let step = 0;
      const render = () => {
        step += 0.003;
        const color1 = `hsl(${Math.sin(step) * 30 + 150}, 40%, 10%)`;
        const color2 = `hsl(${Math.cos(step) * 30 + 220}, 40%, 8%)`;

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        animationFrameId = requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [type]);

  return <canvas ref={canvasRef} class="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
