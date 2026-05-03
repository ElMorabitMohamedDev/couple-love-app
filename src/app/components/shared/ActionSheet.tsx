import { motion, AnimatePresence } from "motion/react";

interface ActionSheetAction {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  title: string;
  subtitle?: string | null;
  actions: ActionSheetAction[];
  onClose: () => void;
}

export function ActionSheet({ open, title, subtitle, actions, onClose }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[2rem] bg-white px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-rose-100" />
            <div className="mb-5 text-center">
              <h3 className="text-lg text-gray-800">{title}</h3>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <div className="space-y-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={`w-full rounded-2xl px-4 py-3 text-sm shadow-sm transition-transform active:scale-[0.98] ${
                    action.tone === "danger"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-gray-50 text-gray-700"
                  } ${action.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {action.label}
                </button>
              ))}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
