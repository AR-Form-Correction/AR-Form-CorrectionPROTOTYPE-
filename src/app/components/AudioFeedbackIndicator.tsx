import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';

interface AudioFeedbackIndicatorProps {
  message: string;
  type: 'correction' | 'encouragement' | 'warning';
}

export function AudioFeedbackIndicator({ message, type }: AudioFeedbackIndicatorProps) {
  const colors = {
    correction: 'bg-blue-500/90',
    encouragement: 'bg-green-500/90',
    warning: 'bg-amber-500/90',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${colors[type]} text-white px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg`}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Volume2 className="w-5 h-5" />
      </motion.div>
      <span>{message}</span>
    </motion.div>
  );
}
