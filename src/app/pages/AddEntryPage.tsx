import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Heart, Image as ImageIcon, Moon, Send, Smile, Star, X } from "lucide-react";
import { apiFetch, getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { JournalEntry } from "../lib/types";

const moods = [
  { id: "love", label: "In Love", icon: Heart, color: "bg-rose-100 text-rose-600" },
  { id: "happy", label: "Happy", icon: Smile, color: "bg-yellow-100 text-yellow-600" },
  { id: "miss", label: "Missing You", icon: Moon, color: "bg-indigo-100 text-indigo-600" },
  { id: "grateful", label: "Grateful", icon: Star, color: "bg-amber-100 text-amber-600" },
] as const;

export function AddEntryPage() {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const isEditing = Boolean(entryId);
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !entryId) {
      return;
    }

    let active = true;

    const loadEntry = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<JournalEntry>(`/journal-entries/${entryId}`, { token });

        if (!active) {
          return;
        }

        setSelectedMood(payload.mood);
        setText(payload.text);
        setError(null);
      } catch (caught) {
        if (active) {
          setError(getApiErrorMessage(caught));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEntry();

    return () => {
      active = false;
    };
  }, [entryId, token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !selectedMood || !text.trim()) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      if (isEditing && entryId) {
        await apiFetch(`/journal-entries/${entryId}`, {
          method: "PUT",
          token,
          body: {
            mood: selectedMood,
            body: text.trim(),
          },
        });
      } else {
        const formData = new FormData();
        formData.append("mood", selectedMood);
        formData.append("body", text.trim());
        files.forEach((file) => formData.append("media[]", file));

        await apiFetch("/journal-entries", {
          method: "POST",
          token,
          body: formData,
        });
      }

      navigate("/journal", { replace: true });
    } catch (caught) {
      console.error("[journal] save failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-6 flex items-center justify-between pt-4">
        <h1 className="text-2xl text-gray-800">{isEditing ? "Edit Entry" : "New Entry"}</h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 transition-all hover:bg-gray-100 active:scale-95"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-sm text-gray-500 shadow-md">Loading your entry...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-3">
            <label className="block text-sm text-gray-600">How are you feeling?</label>
            <div className="grid grid-cols-2 gap-3">
              {moods.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMood(mood.id)}
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      selectedMood === mood.id
                        ? `${mood.color} scale-95 border-current`
                        : "border-gray-200 bg-white text-gray-600 active:scale-95"
                    }`}
                  >
                    <Icon className="mx-auto mb-2 h-6 w-6" />
                    <div className="text-sm">{mood.label}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="space-y-3"
          >
            <label htmlFor="entry-text" className="block text-sm text-gray-600">
              What's on your mind?
            </label>
            <textarea
              id="entry-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Share your thoughts, feelings, or a special moment..."
              rows={8}
              className="w-full resize-none rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 outline-none transition-colors focus:border-rose-400"
            />
          </motion.div>

          {!isEditing && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="space-y-3"
            >
              <label className="block text-sm text-gray-600">Add photos or videos (optional)</label>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*,.heic,.heif"
                className="hidden"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-gray-300 p-6 text-gray-400 transition-colors hover:border-rose-300 hover:text-rose-400"
              >
                <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                <div className="text-sm">{files.length > 0 ? `${files.length} file(s) selected` : "Tap to upload"}</div>
              </button>
              {files.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
                  {files.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="truncate text-sm text-gray-600">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {isEditing && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              You can edit the words and mood here. Attached media stays unchanged.
            </div>
          )}

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.24 }}
            type="submit"
            disabled={!text.trim() || !selectedMood || busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {busy ? "Saving..." : isEditing ? "Save Changes" : "Save Entry"}
          </motion.button>
        </form>
      )}
    </div>
  );
}
