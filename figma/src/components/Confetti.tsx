import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Colores vibrantes del sistema de diseño
    const colors = [
      '#06B6D4', // Cyan
      '#8B5CF6', // Purple
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
    ];

    // Crear partículas
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speedX: (Math.random() - 0.5) * 3,
      speedY: Math.random() * 2 + 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    setParticles(newParticles);

    // Limpiar después de la animación
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: particle.size > 6 ? '2px' : '50%',
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confetti-fall 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            '--speed-x': `${particle.speedX}vw`,
            '--speed-y': `${particle.speedY + 100}vh`,
            '--rotation': `${particle.rotationSpeed * 360}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
