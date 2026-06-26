import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Moon, PlusCircle, Smile, Star, Sun } from "lucide-react";
import { ActionSheet } from "../components/shared/ActionSheet";
import { useLongPress } from "../hooks/useLongPress";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { JournalEntry } from "../lib/types";

const moodIcons = {
  love: { icon: Heart, color: "text-rose-500 fill-rose-500" },
  happy: { icon: Smile, color: "text-yellow-500" },
  miss: { icon: Moon, color: "text-indigo-500" },
  grateful: { icon: Star, color: "text-amber-500 fill-amber-500" },
} as const;

function JournalEntryCard({
  entry,
  index,
  onOpen,
}: {
  entry: JournalEntry;
  index: number;
  onOpen: (entry: JournalEntry) => void;
}) {
  const MoodIcon = moodIcons[entry.mood]?.icon ?? Sun;
  const moodColor = moodIcons[entry.mood]?.color ?? "text-gray-500";
  const longPress = useLongPress({
    onLongPress: () => onOpen(entry),
  });

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      onPointerDown={longPress.onPointerDown}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      onContextMenu={longPress.onContextMenu}
      className="space-y-3 rounded-3xl bg-white p-6 shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-gray-800">{entry.author}</div>
          <div className="text-xs text-gray-400">
            {entry.date} | {entry.time}
          </div>
        </div>
        <MoodIcon className={`h-6 w-6 ${moodColor}`} />
      </div>

      <p className="leading-relaxed text-gray-700">{entry.text}</p>

      {entry.media.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {entry.media.map((media) => (
            <div key={media.id} className="overflow-hidden rounded-2xl bg-rose-50">
              {media.type === "video" ? (
                <video src={media.url} controls className="aspect-square h-full w-full object-cover" />
              ) : (
                <img src={media.url} alt="" className="aspect-square h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-1 text-[11px] text-gray-400">
        Press and hold for entry options
      </div>
    </motion.div>
  );
}

export function JournalPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [busyEntryId, setBusyEntryId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    if (!token) {
      return;
    }

    const payload = await apiFetch<JournalEntry[]>("/journal-entries", { token });
    setEntries(payload);
    setError(null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadEntriesSafely = async () => {
      try {
        const payload = await apiFetch<JournalEntry[]>("/journal-entries", { token });

        if (!active) {
          return;
        }

        setEntries(payload);
        setError(null);
      } catch (caught) {
        if (active) {
          console.error("[journal] load failed", caught);
          setError(getApiErrorMessage(caught));
        }
      }
    };

    void loadEntriesSafely();

    return () => {
      active = false;
    };
  }, [token]);

  useLiveRefresh(
    () => loadEntries(),
    {
      enabled: Boolean(token),
      intervalMs: 15000,
    }
  );

  const handleDelete = async () => {
    if (!token || !selectedEntry) {
      return;
    }

    const confirmed = window.confirm("Delete this journal entry? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      setBusyEntryId(selectedEntry.id);
      await apiFetch(`/journal-entries/${selectedEntry.id}`, {
        method: "DELETE",
        token,
      });
      setEntries((current) => current.filter((entry) => entry.id !== selectedEntry.id));
      setSelectedEntry(null);
      setError(null);
    } catch (caught) {
      console.error("[journal] delete failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusyEntryId(null);
    }
  };

  const actionSubtitle = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }

    if (selectedEntry.can_edit) {
      return "You can still edit or delete this entry because it is within the 30-minute window.";
    }

    return "Entries become read-only 30 minutes after they are created.";
  }, [selectedEntry]);

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-rose-50 to-transparent p-6 pb-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-gray-800">Our Love Journal</h1>
          <button
            onClick={() => navigate("/add-entry")}
            className="rounded-full bg-rose-500 p-3 text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-6 pb-6">
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

        {entries.map((entry, index) => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            index={index}
            onOpen={setSelectedEntry}
          />
        ))}

        {entries.length === 0 && !error && (
          <div className="space-y-4 py-12 text-center">
            <div className="text-5xl text-rose-300">Notes</div>
            <p className="text-gray-500">No entries yet</p>
            <button onClick={() => navigate("/add-entry")} className="text-rose-500">
              Write your first entry
            </button>
          </div>
        )}
      </div>

      <ActionSheet
        open={Boolean(selectedEntry)}
        title={selectedEntry?.author ? `${selectedEntry.author}'s entry` : "Entry options"}
        subtitle={actionSubtitle}
        onClose={() => setSelectedEntry(null)}
        actions={[
          {
            label: selectedEntry?.can_edit ? "Edit Entry" : "Editing unavailable",
            disabled: !selectedEntry?.can_edit,
            onClick: () => {
              if (!selectedEntry?.can_edit) {
                return;
              }

              navigate(`/journal/${selectedEntry.id}/edit`);
              setSelectedEntry(null);
            },
          },
          {
            label: busyEntryId === selectedEntry?.id ? "Deleting..." : "Delete Entry",
            tone: "danger",
            disabled: !selectedEntry?.can_delete || busyEntryId === selectedEntry?.id,
            onClick: () => {
              if (!selectedEntry?.can_delete || busyEntryId === selectedEntry.id) {
                return;
              }

              void handleDelete();
            },
          },
        ]}
      />
    </div>
  );
}
