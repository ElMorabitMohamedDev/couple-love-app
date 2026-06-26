import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HeartHandshake, Send } from "lucide-react";
import { apiFetch, ApiError } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export function ReconciliationButton() {
  const { token } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!token) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      await apiFetch("/reconciliation-nudges", {
        method: "POST",
        token,
        body: {
          message: "I care about us. Let's talk when you're ready.",
        },
      });

      setSent(true);
      window.setTimeout(() => {
        setShowDialog(false);
        setSent(false);
      }, 1800);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to send the message right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDialog(true)}
        className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-teal-100 to-cyan-100 p-5 shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-3">
            <HeartHandshake className="h-6 w-6 text-teal-600" />
          </div>
          <div className="text-left">
            <div className="text-gray-800">I want to fix things</div>
            <div className="text-sm text-gray-500">Send a gentle message</div>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {showDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => !sent && !busy && setShowDialog(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
            >
              {!sent ? (
                <div className="space-y-6">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                      <HeartHandshake className="h-8 w-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl text-gray-800">Reach Out</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Send a gentle notification to your partner letting them know you want to reconnect and work things out together.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-teal-50 p-4">
                    <p className="text-center text-sm italic text-gray-700">
                      "I care about us. Let's talk when you're ready."
                    </p>
                  </div>

                  {error && <p className="text-sm text-rose-500">{error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDialog(false)}
                      className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleSend()}
                      disabled={busy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-white disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {busy ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100"
                  >
                    <span className="text-3xl text-teal-600">OK</span>
                  </motion.div>
                  <p className="text-gray-700">Message sent</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
