import { motion } from 'motion/react';

interface JointHighlightProps {
  x: number;
  y: number;
  label: string;
  isCorrect: boolean;
}

export function JointHighlight({ x, y, label, isCorrect }: JointHighlightProps) {
  return (
    <g>
      {!isCorrect && (
        <>
          {/* Pulsing circle indicator */}
          <motion.circle
            cx={x}
            cy={y}
            r="12"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            opacity="0.8"
            animate={{
              r: [12, 16, 12],
              opacity: [0.8, 0.3, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Label */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <rect
              x={x - 30}
              y={y - 30}
              width="60"
              height="20"
              rx="4"
              fill="#ef4444"
              opacity="0.9"
            />
            <text
              x={x}
              y={y - 16}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="600"
            >
              {label}
            </text>
          </motion.g>
        </>
      )}
    </g>
  );
}
