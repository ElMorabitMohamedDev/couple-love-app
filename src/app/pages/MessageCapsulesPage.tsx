import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, Lock, Mail, Plus, Unlock, X } from "lucide-react";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { MessageCapsule } from "../lib/types";

export function MessageCapsulesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [capsules, setCapsules] = useState<MessageCapsule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<MessageCapsule | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCapsules = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const payload = await apiFetch<MessageCapsule[]>("/message-capsules", { token });
      setCapsules(payload);
      setError(null);
    } catch (caught) {
      console.error("[capsules] load failed", caught);
      setError(getApiErrorMessage(caught));
    }
  }, [token]);

  useEffect(() => {
    void loadCapsules();
  }, [loadCapsules]);

  useLiveRefresh(
    () => loadCapsules(),
    {
      enabled: Boolean(token),
      intervalMs: 20000,
    }
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !newMessage.trim() || !unlockDate) {
      return;
    }

    try {
      setBusy(true);
      await apiFetch("/message-capsules", {
        method: "POST",
        token,
        body: {
          message: newMessage.trim(),
          unlock_date: unlockDate,
        },
      });

      setNewMessage("");
      setUnlockDate("");
      setShowForm(false);
      await loadCapsules();
    } catch (caught) {
      console.error("[capsules] save failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-6 flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-2xl text-gray-800">Message Capsules</h1>
        </div>
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100">
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 rounded-3xl bg-blue-50 p-5">
        <p className="text-center text-sm leading-relaxed text-gray-700">
          Write messages to your future selves. They will unlock on the date you choose.
        </p>
      </motion.div>

      {!showForm ? (
        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setShowForm(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 py-4 text-white shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Create Capsule
        </motion.button>
      ) : (
        <motion.form
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-3xl bg-white p-6 shadow-md"
        >
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Your Message</label>
            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Write a message to your future selves..."
              rows={5}
              className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-colors focus:border-blue-400"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Unlock Date
            </label>
            <input
              type="date"
              value={unlockDate}
              onChange={(event) => setUnlockDate(event.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-colors focus:border-blue-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewMessage("");
                setUnlockDate("");
              }}
              className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || !unlockDate || busy}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-white disabled:opacity-50"
            >
              {busy ? "Locking..." : "Lock Capsule"}
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      <div className="space-y-4">
        {capsules.map((capsule, index) => (
          <motion.button
            key={capsule.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !capsule.is_locked && setSelectedCapsule(capsule)}
            className={`w-full rounded-3xl p-6 text-left shadow-md ${
              capsule.is_locked
                ? "bg-gradient-to-br from-gray-100 to-gray-200"
                : "border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="pt-1">
                {capsule.is_locked ? (
                  <Lock className="h-6 w-6 text-gray-500" />
                ) : (
                  <Unlock className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                {capsule.is_locked ? (
                  <>
                    <p className="italic text-gray-600">{capsule.preview}</p>
                    <div className="text-sm text-gray-500">
                      Unlocks in {capsule.days_until_unlock} days | {capsule.unlock_date}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="line-clamp-3 leading-relaxed text-gray-800">{capsule.message}</p>
                    <div className="text-sm text-gray-500">From {capsule.author} | Unlocked</div>
                  </>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            onClick={() => setSelectedCapsule(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-4 text-center">
                <Unlock className="mx-auto h-16 w-16 text-blue-600" />
                <h3 className="text-xl text-gray-800">Capsule Unlocked</h3>
                <p className="leading-relaxed text-gray-700">{selectedCapsule.message}</p>
                <button
                  onClick={() => setSelectedCapsule(null)}
                  className="w-full rounded-2xl bg-blue-500 py-3 text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
