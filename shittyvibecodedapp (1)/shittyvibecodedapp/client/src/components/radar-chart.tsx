import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface RadarChartProps {
  attributes: {
    physique: number;
    mental: number;
    success: number;
    social: number;
    skills: number;
  };
  maxValue?: number;
}

export function RadarChart({ attributes, maxValue = 20 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 120;

    const attributeNames = ["Physique", "Mental", "Success", "Social", "Skills"];
    const values = [
      attributes.physique,
      attributes.mental,
      attributes.success,
      attributes.social,
      attributes.skills,
    ];

    // Calculate angles for each attribute
    const angles = attributeNames.map((_, i) => (i * 2 * Math.PI) / attributeNames.length - Math.PI / 2);

    let animationFrame = 0;
    const maxFrames = 60;

    function animate() {
      if (!ctx || !canvas) return;

      animationFrame++;
      const progress = Math.min(animationFrame / maxFrames, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "hsl(0, 0%, 20%)";
      ctx.lineWidth = 1;

      // Draw concentric circles
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw axes
      angles.forEach((angle, i) => {
        const x = centerX + Math.cos(angle) * maxRadius;
        const y = centerY + Math.sin(angle) * maxRadius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = "hsl(0, 0%, 20%)";
        ctx.font = "12px Inter";
        ctx.textAlign = "center";
        const labelX = centerX + Math.cos(angle) * (maxRadius + 20);
        const labelY = centerY + Math.sin(angle) * (maxRadius + 20);
        ctx.fillText(attributeNames[i], labelX, labelY + 4);
      });

      // Draw attribute polygon with animation
      ctx.beginPath();
      values.forEach((value, i) => {
        const animatedValue = value * easeOut;
        const normalizedValue = Math.min(animatedValue / maxValue, 1);
        const radius = normalizedValue * maxRadius;
        const x = centerX + Math.cos(angles[i]) * radius;
        const y = centerY + Math.sin(angles[i]) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      // Fill
      ctx.fillStyle = "hsla(0, 0%, 20%, 0.1)";
      ctx.fill();

      // Stroke
      ctx.strokeStyle = "hsl(0, 0%, 20%)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      ctx.fillStyle = "hsl(0, 0%, 20%)";
      values.forEach((value, i) => {
        const animatedValue = value * easeOut;
        const normalizedValue = Math.min(animatedValue / maxValue, 1);
        const radius = normalizedValue * maxRadius;
        const x = centerX + Math.cos(angles[i]) * radius;
        const y = centerY + Math.sin(angles[i]) * radius;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [attributes, maxValue]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <div className="radar-chart">
        <canvas
          ref={canvasRef}
          width="300"
          height="300"
          className="max-w-full"
          data-testid="radar-chart"
        />
      </div>
    </motion.div>
  );
}
