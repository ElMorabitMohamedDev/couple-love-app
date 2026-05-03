import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MessageCircle, Send, Shield, X } from "lucide-react";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { AnonymousMessage } from "../lib/types";

export function AnonymousSpacePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const payload = await apiFetch<AnonymousMessage[]>("/anonymous-messages", { token });
      setMessages(payload);
      setError(null);
    } catch (caught) {
      console.error("[anonymous] load failed", caught);
      setError(getApiErrorMessage(caught));
    }
  }, [token]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useLiveRefresh(
    () => loadMessages(),
    {
      enabled: Boolean(token),
      intervalMs: 20000,
    }
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !message.trim()) {
      return;
    }

    try {
      setBusy(true);
      await apiFetch("/anonymous-messages", {
        method: "POST",
        token,
        body: {
          body: message.trim(),
        },
      });

      setMessage("");
      setShowForm(false);
      await loadMessages();
    } catch (caught) {
      console.error("[anonymous] save failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-6 flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-indigo-100 p-2">
            <Shield className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl text-gray-800">Safe Space</h1>
        </div>
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100">
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 rounded-3xl bg-indigo-50 p-5">
        <div className="flex gap-3">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
          <p className="text-sm leading-relaxed text-gray-700">
            This is a safe space to express honest feelings without showing who wrote them. Share what is hard to say directly.
          </p>
        </div>
      </motion.div>

      {!showForm ? (
        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setShowForm(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-white shadow-lg"
        >
          <MessageCircle className="h-5 w-5" />
          Write Anonymously
        </motion.button>
      ) : (
        <motion.form
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-3xl bg-white p-6 shadow-md"
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Share what is on your mind..."
            rows={6}
            className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-colors focus:border-indigo-400"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setMessage("");
              }}
              className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {busy ? "Sharing..." : "Share"}
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      <div className="space-y-4">
        <h2 className="px-2 text-sm text-gray-500">Shared Thoughts</h2>
        {messages.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-3 rounded-3xl bg-white p-5 shadow-md"
          >
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Anonymous | {item.date}</span>
            </div>
            <p className="leading-relaxed text-gray-700">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
