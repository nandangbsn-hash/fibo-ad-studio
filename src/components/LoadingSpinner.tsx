import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "pulse" | "orbital";
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({
  size = "md",
  variant = "default",
  className,
  text,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "rounded-full bg-primary",
                size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-4 h-4"
              )}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        {text && (
          <motion.p
            className={cn("text-muted-foreground", textSizeClasses[size])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="relative">
          <motion.div
            className={cn("rounded-full bg-primary/20", sizeClasses[size])}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={cn(
              "absolute inset-0 m-auto rounded-full bg-primary",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-6 h-6"
            )}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        {text && (
          <motion.p
            className={cn("text-muted-foreground", textSizeClasses[size])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === "orbital") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className={cn("relative", sizeClasses[size])}>
          {/* Center dot */}
          <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-primary" />

          {/* Orbiting dot */}
          <motion.div
            className="absolute w-full h-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
          </motion.div>

          {/* Second orbiting dot */}
          <motion.div
            className="absolute w-full h-full"
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
          </motion.div>
        </div>
        {text && (
          <motion.p
            className={cn("text-muted-foreground", textSizeClasses[size])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Track */}
        <div className="absolute inset-0 rounded-full border-2 border-muted" />

        {/* Spinner */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      {text && (
        <motion.p
          className={cn("text-muted-foreground", textSizeClasses[size])}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// AI Generation Loading State
export const AILoadingState = ({
  text = "AI is thinking...",
  steps,
  currentStep,
}: {
  text?: string;
  steps?: string[];
  currentStep?: number;
}) => {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Neural network visualization */}
      <div className="relative w-24 h-24">
        {/* Rotating gradient ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent 30%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-card" />

        {/* Center pulsing dot */}
        <motion.div
          className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-primary"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          >
            <div
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              style={{
                top: "10%",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Text */}
      <motion.p
        className="text-foreground font-medium"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {text}
      </motion.p>

      {/* Steps progress */}
      {steps && currentStep !== undefined && (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {steps.map((step, i) => (
            <motion.div
              key={step}
              className={cn(
                "flex items-center gap-3 text-sm",
                i < currentStep ? "text-primary" : i === currentStep ? "text-foreground" : "text-muted-foreground"
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs border",
                  i < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : i === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span>{step}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
