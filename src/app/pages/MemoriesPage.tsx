import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Image as ImageIcon, Pencil, PlusCircle, Video, X } from "lucide-react";
import { ActionSheet } from "../components/shared/ActionSheet";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { useLongPress } from "../hooks/useLongPress";
import { apiFetch, getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { MemoriesResponse, MemoryItem } from "../lib/types";

function MemoryCard({
  memory,
  index,
  onOpen,
}: {
  memory: MemoryItem;
  index: number;
  onOpen: (memory: MemoryItem) => void;
}) {
  const longPress = useLongPress({
    onLongPress: () => onOpen(memory),
  });

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      onPointerDown={longPress.onPointerDown}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      onContextMenu={longPress.onContextMenu}
      className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 shadow-md"
    >
      {memory.type === "video" ? (
        <video src={memory.url} controls className="h-full w-full object-cover" />
      ) : (
        <img src={memory.url} alt={memory.caption ?? "Memory"} className="h-full w-full object-cover" />
      )}

      <div className="absolute left-0 right-0 top-3 flex justify-center">
        <div className="rounded-full bg-black/40 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
          {memory.type === "video" ? (
            <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Video</span>
          ) : (
            <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Photo</span>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-3">
        <div className="flex items-end justify-between gap-2 text-xs text-white">
          <div className="min-w-0">
            <div className="truncate">{memory.caption ?? memory.date}</div>
            <div className="text-[11px] text-white/80">{memory.date}</div>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3 fill-current" />
            <span>{memory.likes}</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-white/80">Press and hold for options</div>
      </div>
    </motion.div>
  );
}

export function MemoriesPage() {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    caption: "",
    description: "",
  });
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

  const loadMemories = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const payload = await apiFetch<MemoriesResponse>("/memories", { token });
      setMemories(payload.items);
      setError(null);
    } catch (caught) {
      console.error("[memories] load failed", caught);
      setError(getApiErrorMessage(caught));
    }
  }, [token]);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  useLiveRefresh(
    () => loadMemories(),
    {
      enabled: Boolean(token),
      intervalMs: 20000,
    }
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || !token) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", file.name.replace(/\.[^.]+$/, ""));
        formData.append("description", "A new moment added from the gallery.");

        await apiFetch("/memories", {
          method: "POST",
          token,
          body: formData,
        });
      }

      await loadMemories();
    } catch (caught) {
      console.error("[memories] upload failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedMemory) {
      return;
    }

    const confirmed = window.confirm("Delete this memory?");
    if (!confirmed) {
      return;
    }

    try {
      setBusy(true);
      await apiFetch(`/memories/${selectedMemory.id}`, {
        method: "DELETE",
        token,
      });
      setMemories((current) => current.filter((memory) => memory.id !== selectedMemory.id));
      setSelectedMemory(null);
      setError(null);
    } catch (caught) {
      console.error("[memories] delete failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const openEditModal = () => {
    if (!selectedMemory) {
      return;
    }

    setEditingMemory(selectedMemory);
    setEditForm({
      caption: selectedMemory.caption ?? "",
      description: selectedMemory.description ?? "",
    });
    setReplacementFile(null);
    setSelectedMemory(null);
  };

  const handleEditSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editingMemory) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("caption", editForm.caption);
      formData.append("description", editForm.description);
      if (replacementFile) {
        formData.append("file", replacementFile);
      }

      const updated = await apiFetch<MemoryItem>(`/memories/${editingMemory.id}`, {
        method: "POST",
        token,
        body: formData,
      });

      setMemories((current) => current.map((memory) => (memory.id === updated.id ? updated : memory)));
      setEditingMemory(null);
      setReplacementFile(null);
    } catch (caught) {
      console.error("[memories] update failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
      if (editInputRef.current) {
        editInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-rose-50 to-transparent p-6 pb-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-800">Our Memories</h1>
            <p className="text-sm text-gray-500">{memories.length} moments captured</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,.heic,.heif"
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-full bg-rose-500 p-3 text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <PlusCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-6 pb-6">
        {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {busy && <p className="mb-4 text-sm text-gray-500">Saving your memory...</p>}

        <div className="grid grid-cols-2 gap-4">
          {memories.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              index={index}
              onOpen={setSelectedMemory}
            />
          ))}
        </div>

        {memories.length === 0 && !error && (
          <div className="space-y-4 py-12 text-center">
            <div className="text-5xl text-rose-300">Gallery</div>
            <p className="text-gray-500">No memories yet</p>
            <p className="text-sm text-gray-400">Start capturing your special moments together</p>
          </div>
        )}
      </div>

      <ActionSheet
        open={Boolean(selectedMemory)}
        title={selectedMemory?.caption ?? "Memory options"}
        subtitle={selectedMemory?.can_manage ? "You can edit the caption or remove this memory." : "Only the partner who added this memory can change it."}
        onClose={() => setSelectedMemory(null)}
        actions={[
          {
            label: "Edit Memory",
            disabled: !selectedMemory?.can_manage,
            onClick: () => {
              if (!selectedMemory?.can_manage) {
                return;
              }

              openEditModal();
            },
          },
          {
            label: "Delete Memory",
            tone: "danger",
            disabled: !selectedMemory?.can_manage,
            onClick: () => {
              if (!selectedMemory?.can_manage) {
                return;
              }

              void handleDelete();
            },
          },
        ]}
      />

      <AnimatePresence>
        {editingMemory && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMemory(null)}
              className="fixed inset-0 z-40 bg-black/35"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[2rem] bg-white px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg text-gray-800">Edit Memory</h3>
                <button type="button" onClick={() => setEditingMemory(null)} className="rounded-full p-2 text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">Caption</label>
                  <input
                    value={editForm.caption}
                    onChange={(event) => setEditForm((current) => ({ ...current, caption: event.target.value }))}
                    className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    className="w-full resize-none rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">Replace photo or video (optional)</label>
                  <input
                    ref={editInputRef}
                    type="file"
                    accept="image/*,video/*,.heic,.heif"
                    className="hidden"
                    onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => editInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-200 px-4 py-3 text-sm text-rose-500"
                  >
                    <Pencil className="h-4 w-4" />
                    {replacementFile ? replacementFile.name : "Choose a replacement file"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white disabled:opacity-60"
                >
                  {busy ? "Saving..." : "Save Memory"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
