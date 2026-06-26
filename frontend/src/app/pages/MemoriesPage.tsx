import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { PlusCircle } from "lucide-react";
import { ActionSheet } from "../components/shared/ActionSheet";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { MemoriesResponse, MemoryItem } from "../lib/types";
import { MemoryCard } from "./memories/MemoryCard";
import { MemoryEditorSheet } from "./memories/MemoryEditorSheet";

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

  const handleEditSave = async (event: FormEvent<HTMLFormElement>) => {
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
        subtitle={
          selectedMemory?.can_manage
            ? "You can edit the caption or remove this memory."
            : "Only the partner who added this memory can change it."
        }
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

      <MemoryEditorSheet
        open={Boolean(editingMemory)}
        busy={busy}
        memory={editingMemory}
        caption={editForm.caption}
        description={editForm.description}
        replacementFile={replacementFile}
        fileInputRef={editInputRef}
        onClose={() => setEditingMemory(null)}
        onSubmit={handleEditSave}
        onCaptionChange={(value) => setEditForm((current) => ({ ...current, caption: value }))}
        onDescriptionChange={(value) => setEditForm((current) => ({ ...current, description: value }))}
        onReplacementFileChange={setReplacementFile}
      />
    </div>
  );
}
