import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { HandHeart, Plus, X } from "lucide-react";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { PromiseItem } from "../lib/types";

export function PromiseZonePage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [promises, setPromises] = useState<PromiseItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPromise, setNewPromise] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPromises = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const payload = await apiFetch<PromiseItem[]>("/promises", { token });
      setPromises(payload);
      setError(null);
    } catch (caught) {
      console.error("[promises] load failed", caught);
      setError(getApiErrorMessage(caught));
    }
  }, [token]);

  useEffect(() => {
    void loadPromises();
  }, [loadPromises]);

  useLiveRefresh(
    () => loadPromises(),
    {
      enabled: Boolean(token),
      intervalMs: 20000,
    }
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !newPromise.trim()) {
      return;
    }

    try {
      setBusy(true);
      await apiFetch("/promises", {
        method: "POST",
        token,
        body: {
          body: newPromise.trim(),
          author_name: user?.name,
        },
      });

      setNewPromise("");
      setShowForm(false);
      await loadPromises();
    } catch (caught) {
      console.error("[promises] save failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-6 flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2">
            <HandHeart className="h-5 w-5 text-purple-600" />
          </div>
          <h1 className="text-2xl text-gray-800">Our Promises</h1>
        </div>
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100">
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 rounded-3xl bg-purple-50 p-5">
        <p className="text-center text-sm leading-relaxed text-gray-700">
          The promises you make to each other. A sacred space to remember your commitments.
        </p>
      </motion.div>

      {!showForm ? (
        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setShowForm(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-white shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Make a Promise
        </motion.button>
      ) : (
        <motion.form
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-3xl bg-white p-6 shadow-md"
        >
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Your Promise</label>
            <textarea
              value={newPromise}
              onChange={(event) => setNewPromise(event.target.value)}
              placeholder="I promise to..."
              rows={4}
              className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-colors focus:border-purple-400"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewPromise("");
              }}
              className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newPromise.trim() || busy}
              className="flex-1 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save Promise"}
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      <div className="space-y-4">
        {promises.map((promise, index) => (
          <motion.div
            key={promise.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-md"
          >
            <div className="flex items-start gap-4">
              <HandHeart className="mt-1 h-6 w-6 flex-shrink-0 text-purple-600" />
              <div className="flex-1 space-y-2">
                <p className="leading-relaxed text-gray-800">{promise.text}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{promise.author}</span>
                  <span>{promise.date}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
