import { type FormEventHandler, type RefObject } from "react";
import { Pencil, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { MemoryItem } from "../../lib/types";

interface MemoryEditorSheetProps {
  open: boolean;
  busy: boolean;
  memory: MemoryItem | null;
  caption: string;
  description: string;
  replacementFile: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCaptionChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onReplacementFileChange: (file: File | null) => void;
}

export function MemoryEditorSheet({
  open,
  busy,
  memory,
  caption,
  description,
  replacementFile,
  fileInputRef,
  onClose,
  onSubmit,
  onCaptionChange,
  onDescriptionChange,
  onReplacementFileChange,
}: MemoryEditorSheetProps) {
  return (
    <AnimatePresence>
      {open && memory && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Caption</label>
                <input
                  value={caption}
                  onChange={(event) => onCaptionChange(event.target.value)}
                  className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Replace photo or video (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.heic,.heif"
                  className="hidden"
                  onChange={(event) => onReplacementFileChange(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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
  );
}
