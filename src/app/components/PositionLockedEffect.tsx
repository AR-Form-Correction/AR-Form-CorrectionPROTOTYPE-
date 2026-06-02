import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface PositionLockedEffectProps {
  show: boolean;
}

export function PositionLockedEffect({ show }: PositionLockedEffectProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Expanding ring effect */}
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-green-500 rounded-full"
            />
            
            {/* Check icon */}
            <div className="relative bg-green-500 rounded-full p-6">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
