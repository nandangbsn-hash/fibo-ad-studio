import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export interface ColorPoint {
  id: string;
  hue: number; // 0-360
  saturation: number; // 0-100
  label: string;
}

interface ColorWheelProps {
  colorPoints: ColorPoint[];
  onChange: (points: ColorPoint[]) => void;
  bitDepth: string; // '8', '10', '12', '16'
  hdrEnabled: boolean;
  size?: number;
}

// Helper to convert HSL to hex
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Get max saturation based on bit depth and HDR
const getMaxSaturation = (bitDepth: string, hdrEnabled: boolean): number => {
  const baseSaturation = {
    '8': 85,
    '10': 95,
    '12': 100,
    '16': 100,
  }[bitDepth] || 85;
  
  return hdrEnabled ? Math.min(baseSaturation + 15, 100) : baseSaturation;
};

// Get color gamut description
const getGamutDescription = (bitDepth: string, hdrEnabled: boolean): string => {
  if (hdrEnabled) {
    return bitDepth === '16' || bitDepth === '12' 
      ? 'Extended HDR Gamut' 
      : 'HDR Wide Gamut';
  }
  return {
    '8': 'Standard sRGB',
    '10': 'Wide Gamut',
    '12': 'Professional Gamut',
    '16': 'Cinema Grade',
  }[bitDepth] || 'Standard';
};

const ColorWheel = ({ 
  colorPoints, 
  onChange, 
  bitDepth, 
  hdrEnabled,
  size = 200 
}: ColorWheelProps) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const maxSaturation = getMaxSaturation(bitDepth, hdrEnabled);
  const gamutDescription = getGamutDescription(bitDepth, hdrEnabled);
  const radius = size / 2;
  const pointRadius = 12;

  // Convert polar (hue, saturation) to cartesian coordinates
  const polarToCartesian = (hue: number, saturation: number) => {
    const angle = (hue - 90) * (Math.PI / 180); // Start from top
    const r = (saturation / 100) * (radius - pointRadius);
    return {
      x: radius + r * Math.cos(angle),
      y: radius + r * Math.sin(angle)
    };
  };

  // Convert cartesian to polar
  const cartesianToPolar = (x: number, y: number) => {
    const dx = x - radius;
    const dy = y - radius;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), radius - pointRadius);
    const saturation = Math.min((distance / (radius - pointRadius)) * 100, maxSaturation);
    return { hue: angle, saturation };
  };

  const handleMouseDown = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingId(id);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { hue, saturation } = cartesianToPolar(x, y);
    
    const newPoints = colorPoints.map(p => 
      p.id === draggingId ? { ...p, hue, saturation: Math.min(saturation, maxSaturation) } : p
    );
    onChange(newPoints);
  }, [draggingId, colorPoints, onChange, maxSaturation]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  // Generate conic gradient for the wheel with appropriate saturation
  const wheelGradient = `conic-gradient(
    from 0deg,
    hsl(0, ${maxSaturation}%, 50%),
    hsl(30, ${maxSaturation}%, 50%),
    hsl(60, ${maxSaturation}%, 50%),
    hsl(90, ${maxSaturation}%, 50%),
    hsl(120, ${maxSaturation}%, 50%),
    hsl(150, ${maxSaturation}%, 50%),
    hsl(180, ${maxSaturation}%, 50%),
    hsl(210, ${maxSaturation}%, 50%),
    hsl(240, ${maxSaturation}%, 50%),
    hsl(270, ${maxSaturation}%, 50%),
    hsl(300, ${maxSaturation}%, 50%),
    hsl(330, ${maxSaturation}%, 50%),
    hsl(360, ${maxSaturation}%, 50%)
  )`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Color Palette</span>
        <span className="text-xs text-primary/80">{gamutDescription}</span>
      </div>
      
      <div className="flex justify-center">
        <div
          ref={wheelRef}
          className="relative cursor-crosshair"
          style={{ width: size, height: size }}
        >
          {/* Color wheel background */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: wheelGradient,
              opacity: hdrEnabled ? 1 : 0.9,
            }}
          />
          
          {/* White center gradient for saturation */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, 
                hsl(0, 0%, 100%) 0%, 
                hsl(0, 0%, 100%, 0.8) 20%,
                hsl(0, 0%, 100%, 0.5) 40%,
                hsl(0, 0%, 100%, 0.2) 60%,
                transparent 80%
              )`,
            }}
          />

          {/* HDR glow effect */}
          {hdrEnabled && (
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                boxShadow: '0 0 30px rgba(255, 200, 100, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1)',
              }}
            />
          )}

          {/* Connection lines to center */}
          <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
            {colorPoints.map(point => {
              const pos = polarToCartesian(point.hue, point.saturation);
              return (
                <line
                  key={`line-${point.id}`}
                  x1={radius}
                  y1={radius}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Center point */}
          <div
            className="absolute w-3 h-3 bg-background border-2 border-white rounded-full shadow-lg"
            style={{
              left: radius - 6,
              top: radius - 6,
            }}
          />

          {/* Draggable color points */}
          {colorPoints.map(point => {
            const pos = polarToCartesian(point.hue, point.saturation);
            const color = hslToHex(point.hue, point.saturation * (maxSaturation / 100), 50);
            
            return (
              <motion.div
                key={point.id}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: pos.x - pointRadius,
                  top: pos.y - pointRadius,
                  width: pointRadius * 2,
                  height: pointRadius * 2,
                }}
                onMouseDown={handleMouseDown(point.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-full h-full rounded-full border-2 border-white shadow-lg"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: hdrEnabled 
                      ? `0 0 10px ${color}, 0 2px 8px rgba(0,0,0,0.3)` 
                      : '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected colors display */}
      <div className="flex gap-2 justify-center">
        {colorPoints.map(point => {
          const color = hslToHex(point.hue, point.saturation * (maxSaturation / 100), 50);
          return (
            <div key={point.id} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-md border border-border/50"
                style={{ 
                  backgroundColor: color,
                  boxShadow: hdrEnabled ? `0 0 8px ${color}` : 'none'
                }}
              />
              <span className="text-[10px] text-muted-foreground">{point.label}</span>
            </div>
          );
        })}
      </div>

      {/* Bit depth indicator */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span>{bitDepth}-bit · {hdrEnabled ? 'HDR' : 'SDR'}</span>
        <span>Max Saturation: {maxSaturation}%</span>
      </div>
    </div>
  );
};

export default ColorWheel;
