import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Baby, Heart, Image as ImageIcon, User, X } from "lucide-react";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatReadableDate } from "../utils/dates";
import type { Relationship } from "../lib/types";

type PartnerNode = {
  id: number | null;
  name: string;
  role: string;
  birth_date?: string | null;
  avatar_url?: string | null;
  tone: "rose" | "indigo";
};

function PartnerAvatar({ partner }: { partner: PartnerNode }) {
  const gradient =
    partner.tone === "rose"
      ? "from-rose-400 to-pink-500"
      : "from-purple-400 to-indigo-500";

  if (partner.avatar_url) {
    return (
      <img
        src={partner.avatar_url}
        alt={partner.name}
        className="h-24 w-24 rounded-full object-cover shadow-lg"
      />
    );
  }

  return (
    <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-lg`}>
      <User className="h-12 w-12 text-white" />
    </div>
  );
}

export function FamilyTreePage() {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerNode | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const loadRelationship = useCallback(async () => {
    if (!token) {
      return;
    }

    const payload = await apiFetch<Relationship>("/relationship", { token });
    setRelationship(payload);
    setError(null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadRelationshipSafely = async () => {
      try {
        const payload = await apiFetch<Relationship>("/relationship", { token });

        if (!active) {
          return;
        }

        setRelationship(payload);
        setError(null);
      } catch (caught) {
        if (active) {
          console.error("[family-tree] load failed", caught);
          setError(getApiErrorMessage(caught));
        }
      }
    };

    void loadRelationshipSafely();

    return () => {
      active = false;
    };
  }, [token]);

  useLiveRefresh(
    () => loadRelationship(),
    {
      enabled: Boolean(token) && !selectedPartner && !busy,
      intervalMs: 20000,
    }
  );

  const partners = useMemo<PartnerNode[]>(() => [
    {
      id: relationship?.family_tree?.partner_one.id ?? null,
      name: relationship?.family_tree?.partner_one.name ?? relationship?.partner_one_name ?? "Partner 1",
      role: "Partner 1",
      birth_date: relationship?.family_tree?.partner_one.birth_date ?? null,
      avatar_url: relationship?.family_tree?.partner_one.avatar_url ?? null,
      tone: "rose",
    },
    {
      id: relationship?.family_tree?.partner_two.id ?? null,
      name: relationship?.family_tree?.partner_two.name ?? relationship?.partner_two_name ?? "Partner 2",
      role: "Partner 2",
      birth_date: relationship?.family_tree?.partner_two.birth_date ?? null,
      avatar_url: relationship?.family_tree?.partner_two.avatar_url ?? null,
      tone: "indigo",
    },
  ], [relationship]);

  const slots = relationship?.family_tree?.future_children_slots ?? relationship?.future_children_slots ?? 3;

  const openEditor = (partner: PartnerNode) => {
    setSelectedPartner(partner);
    setBirthDate(partner.birth_date ?? "");
    setAvatarFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !selectedPartner?.id) {
      return;
    }

    try {
      setBusy(true);
      setError(null);

      const formData = new FormData();
      formData.append("_method", "PUT");
      if (birthDate) {
        formData.append("birth_date", birthDate);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const payload = await apiFetch<Relationship>(`/family-tree/partners/${selectedPartner.id}`, {
        method: "POST",
        token,
        body: formData,
      });

      setRelationship(payload);
      setSelectedPartner(null);
      setAvatarFile(null);
    } catch (caught) {
      console.error("[family-tree] save failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-8 pt-4">
        <h1 className="mb-2 text-2xl text-gray-800">Our Family Tree</h1>
        <p className="text-sm text-gray-500">Our journey together and the future you are dreaming about</p>
      </div>

      {error && <p className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      <div className="mx-auto max-w-sm space-y-8">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
          <div className="flex items-center justify-center gap-6">
            {partners.map((partner) => (
              <div key={partner.role} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditor(partner)}
                  className="flex flex-col items-center gap-2"
                >
                  <PartnerAvatar partner={partner} />
                  <div className="text-center">
                    <div className="text-sm">{partner.name}</div>
                    <div className="text-xs text-gray-500">{partner.role}</div>
                    {partner.birth_date && (
                      <div className="mt-1 text-[11px] text-gray-400">
                        {formatReadableDate(partner.birth_date)}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          <Heart className="absolute left-1/2 top-8 h-8 w-8 -translate-x-1/2 animate-pulse fill-rose-500 text-rose-500" />

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 60, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mx-auto mt-4 w-0.5 bg-gradient-to-b from-rose-300 to-transparent"
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-8 shadow-md"
        >
          <div className="space-y-4 text-center">
            <Baby className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <h3 className="text-lg text-gray-700">Your Future</h3>
              <p className="text-sm text-gray-500">A beautiful family waiting to grow</p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {Array.from({ length: Math.max(1, Math.min(slots, 6)) }).map((_, index) => (
                <div
                  key={index}
                  className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/60"
                >
                  <Baby className="h-6 w-6 text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl bg-white p-6 shadow-md"
        >
          <p className="text-center text-sm italic text-gray-600">
            "{relationship?.home_quote ?? "Together you are building something beautiful."}"
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPartner(null)}
              className="fixed inset-0 z-40 bg-black/35"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[2rem] bg-white px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg text-gray-800">{selectedPartner.name}</h3>
                <button type="button" onClick={() => setSelectedPartner(null)} className="rounded-full p-2 text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">Birth date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">Change photo</label>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-200 px-4 py-3 text-sm text-rose-500"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {avatarFile ? avatarFile.name : "Choose a new photo"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white disabled:opacity-60"
                >
                  {busy ? "Saving..." : "Save"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
