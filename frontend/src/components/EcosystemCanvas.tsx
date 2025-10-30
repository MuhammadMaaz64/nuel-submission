import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface EcosystemCanvasProps {
  preyCount: number;
  predatorCount: number;
  resourceLevel: number;
  maxPrey: number;
  maxPredator: number;
}

interface Creature {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'prey' | 'predator';
  angle: number;
}

const EcosystemCanvas: React.FC<EcosystemCanvasProps> = ({
  preyCount,
  predatorCount,
  resourceLevel,
  maxPrey,
  maxPredator,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Initialize creatures
  useEffect(() => {
    const newCreatures: Creature[] = [];
    
    // Scale creature counts for visualization (max 50 of each for performance)
    const visualPreyCount = Math.min(50, Math.floor((preyCount / maxPrey) * 50));
    const visualPredatorCount = Math.min(20, Math.floor((predatorCount / maxPredator) * 20));

    // Create prey
    for (let i = 0; i < visualPreyCount; i++) {
      newCreatures.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 8 + Math.random() * 4,
        type: 'prey',
        angle: Math.random() * Math.PI * 2,
      });
    }

    // Create predators
    for (let i = 0; i < visualPredatorCount; i++) {
      newCreatures.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 12 + Math.random() * 6,
        type: 'predator',
        angle: Math.random() * Math.PI * 2,
      });
    }

    setCreatures(newCreatures);
  }, [preyCount, predatorCount, maxPrey, maxPredator, dimensions]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw background gradient based on resource level
      const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
      const greenIntensity = Math.floor(100 + resourceLevel * 100);
      gradient.addColorStop(0, `rgb(${255 - greenIntensity}, 255, ${255 - greenIntensity})`);
      gradient.addColorStop(1, `rgb(${230 - greenIntensity}, 240, ${230 - greenIntensity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw grass patches based on resource level
      const grassPatches = Math.floor(resourceLevel * 30);
      ctx.fillStyle = `rgba(34, 197, 94, ${resourceLevel * 0.3})`;
      for (let i = 0; i < grassPatches; i++) {
        const x = (i * 73) % dimensions.width;
        const y = (i * 47) % dimensions.height;
        ctx.beginPath();
        ctx.arc(x, y, 20 + Math.sin(i) * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw creatures
      setCreatures(prevCreatures => {
        return prevCreatures.map(creature => {
          // Update position
          let newX = creature.x + creature.vx;
          let newY = creature.y + creature.vy;
          let newVx = creature.vx;
          let newVy = creature.vy;

          // Bounce off walls
          if (newX < creature.size || newX > dimensions.width - creature.size) {
            newVx = -newVx;
            newX = Math.max(creature.size, Math.min(dimensions.width - creature.size, newX));
          }
          if (newY < creature.size || newY > dimensions.height - creature.size) {
            newVy = -newVy;
            newY = Math.max(creature.size, Math.min(dimensions.height - creature.size, newY));
          }

          // Add some random movement
          newVx += (Math.random() - 0.5) * 0.2;
          newVy += (Math.random() - 0.5) * 0.2;

          // Limit speed
          const maxSpeed = creature.type === 'prey' ? 2 : 1.5;
          const speed = Math.sqrt(newVx * newVx + newVy * newVy);
          if (speed > maxSpeed) {
            newVx = (newVx / speed) * maxSpeed;
            newVy = (newVy / speed) * maxSpeed;
          }

          // Update angle based on movement direction
          const newAngle = Math.atan2(newVy, newVx);

          // Draw creature
          ctx.save();
          ctx.translate(newX, newY);
          ctx.rotate(newAngle);

          if (creature.type === 'prey') {
            // Draw prey as fish-like shape
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.ellipse(0, 0, creature.size, creature.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(creature.size * 0.3, -creature.size * 0.1, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.moveTo(-creature.size, 0);
            ctx.lineTo(-creature.size * 1.5, -creature.size * 0.3);
            ctx.lineTo(-creature.size * 1.5, creature.size * 0.3);
            ctx.closePath();
            ctx.fill();
          } else {
            // Draw predator as shark-like shape
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(0, 0, creature.size, creature.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Fin
            ctx.beginPath();
            ctx.moveTo(0, -creature.size * 0.6);
            ctx.lineTo(-creature.size * 0.3, -creature.size);
            ctx.lineTo(creature.size * 0.3, -creature.size * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(creature.size * 0.3, -creature.size * 0.15, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Teeth
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(creature.size * 0.5, 0);
            ctx.lineTo(creature.size * 0.6, -creature.size * 0.1);
            ctx.moveTo(creature.size * 0.5, 0);
            ctx.lineTo(creature.size * 0.6, creature.size * 0.1);
            ctx.stroke();
          }

          ctx.restore();

          return {
            ...creature,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            angle: newAngle,
          };
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    animationRef.current = animationId;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, resourceLevel]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = Math.min(400, width * 0.5);
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full rounded-lg border border-gray-200 shadow-inner"
      />
      
      {/* Overlay Stats */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-prey rounded-full" />
            <span className="font-medium">{Math.round(preyCount)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-predator rounded-full" />
            <span className="font-medium">{Math.round(predatorCount)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-600">🌱</span>
            <span className="font-medium">{Math.round(resourceLevel * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcosystemCanvas;
