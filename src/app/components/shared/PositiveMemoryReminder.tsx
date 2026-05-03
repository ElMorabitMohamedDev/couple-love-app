import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import type { MemoryReminder } from "../../lib/types";

interface PositiveMemoryReminderProps {
  reminder?: MemoryReminder;
  show: boolean;
  onClose: () => void;
}

export function PositiveMemoryReminder({ reminder, show, onClose }: PositiveMemoryReminderProps) {
  const navigate = useNavigate();

  if (!reminder) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed left-4 right-4 top-20 z-40 mx-auto max-w-sm"
        >
          <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-100 to-yellow-100 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="mb-2 text-sm text-amber-800">Remember the good times</div>
                  <p className="leading-relaxed text-gray-700">{reminder.text}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate("/memories");
                  }}
                  className="text-sm text-amber-700 underline"
                >
                  See all our memories
                </button>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-amber-200"
              >
                <X className="h-4 w-4 text-amber-700" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
