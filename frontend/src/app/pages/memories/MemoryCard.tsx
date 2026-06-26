import { Heart, Image as ImageIcon, Video } from "lucide-react";
import { motion } from "motion/react";
import { useLongPress } from "../../hooks/useLongPress";
import type { MemoryItem } from "../../lib/types";

interface MemoryCardProps {
  memory: MemoryItem;
  index: number;
  onOpen: (memory: MemoryItem) => void;
}

export function MemoryCard({ memory, index, onOpen }: MemoryCardProps) {
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
            <span className="inline-flex items-center gap-1">
              <Video className="h-3 w-3" /> Video
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Photo
            </span>
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
