import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  variant?: "default" | "subtle" | "intense";
  showOrbs?: boolean;
  showGrid?: boolean;
  showNoise?: boolean;
}

export const AnimatedBackground = ({
  variant = "default",
  showOrbs = true,
  showGrid = false,
  showNoise = true,
}: AnimatedBackgroundProps) => {
  const orbOpacity = variant === "subtle" ? 0.3 : variant === "intense" ? 0.6 : 0.4;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-dark" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 mesh-gradient opacity-80" />

      {/* Animated gradient orbs */}
      {showOrbs && (
        <>
          {/* Primary gold orb - top right */}
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(38 92% 55% / ${orbOpacity * 0.3}) 0%, transparent 70%)`,
              filter: "blur(60px)",
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Purple orb - left */}
          <motion.div
            className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(280 70% 55% / ${orbOpacity * 0.2}) 0%, transparent 70%)`,
              filter: "blur(80px)",
            }}
            animate={{
              x: [0, 20, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* Blue orb - bottom */}
          <motion.div
            className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(220 70% 50% / ${orbOpacity * 0.2}) 0%, transparent 70%)`,
              filter: "blur(60px)",
            }}
            animate={{
              x: [0, -30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />

          {/* Cyan accent orb - right center */}
          <motion.div
            className="absolute top-2/3 right-1/4 w-[300px] h-[300px] rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(190 85% 50% / ${orbOpacity * 0.15}) 0%, transparent 70%)`,
              filter: "blur(50px)",
            }}
            animate={{
              x: [0, 25, 0],
              y: [0, -30, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </>
      )}

      {/* Subtle grid pattern */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      )}

      {/* Noise texture */}
      {showNoise && <div className="noise-overlay" />}

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, hsl(220 16% 6% / 0.4) 100%)",
        }}
      />
    </div>
  );
};
