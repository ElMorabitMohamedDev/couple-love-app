import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { BookHeart, Calendar, Frown, Heart, HeartCrack, Image, Meh, PlusCircle, Smile, Sparkles } from "lucide-react";
import { apiFetch, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PositiveMemoryReminder } from "../components/shared/PositiveMemoryReminder";
import { UpcomingBirthdayList } from "../components/shared/UpcomingBirthdayList";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import type { DashboardData, UpcomingBirthday } from "../lib/types";

const moods = [
  { id: "happy", icon: Smile, label: "Happy", color: "bg-yellow-100 text-yellow-600" },
  { id: "sad", icon: Frown, label: "Sad", color: "bg-blue-100 text-blue-600" },
  { id: "miss", icon: HeartCrack, label: "Miss You", color: "bg-purple-100 text-purple-600" },
  { id: "neutral", icon: Meh, label: "Neutral", color: "bg-gray-100 text-gray-600" },
] as const;

function calculateTime(startedAt?: string) {
  if (!startedAt) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const start = new Date(startedAt);
  const now = new Date();
  const diff = now.getTime() - start.getTime();

  return {
    days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
    seconds: Math.max(0, Math.floor((diff % (1000 * 60)) / 1000)),
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(calculateTime());
  const [busyMood, setBusyMood] = useState<string | null>(null);
  const [showMemoryReminder, setShowMemoryReminder] = useState(false);
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    const [payload, upcomingBirthdays] = await Promise.all([
      apiFetch<DashboardData>("/dashboard", { token }),
      apiFetch<UpcomingBirthday[]>("/birthdays/upcoming", { token }),
    ]);

    setDashboard(payload);
    setBirthdays(upcomingBirthdays);
    setTimeElapsed(calculateTime(payload.relationship?.started_at));
    setError(null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadDashboardSafely = async () => {
      try {
        await loadDashboard();

        if (!active) {
          return;
        }
      } catch (caught) {
        if (!active) {
          return;
        }

        console.error("[home] dashboard load failed", caught);
        setError(getApiErrorMessage(caught));
      }
    };

    void loadDashboardSafely();

    return () => {
      active = false;
    };
  }, [loadDashboard, token]);

  useLiveRefresh(
    () => loadDashboard(),
    {
      enabled: Boolean(token),
      intervalMs: 15000,
    }
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeElapsed(calculateTime(dashboard?.relationship?.started_at));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [dashboard?.relationship?.started_at]);

  const handleMoodSelect = async (mood: string) => {
    if (!token || !dashboard) {
      return;
    }

    try {
      setBusyMood(mood);

      const payload = await apiFetch<{
        date: string;
        my_mood: string | null;
        partner_mood: string | null;
        partner_name: string | null;
      }>("/moods/today", {
        method: "PUT",
        token,
        body: { mood },
      });

      setDashboard({
        ...dashboard,
        current_user: {
          ...dashboard.current_user,
          today_mood: payload.my_mood,
        },
        partner: dashboard.partner
          ? {
              ...dashboard.partner,
              today_mood: payload.partner_mood,
              name: payload.partner_name ?? dashboard.partner.name,
            }
          : null,
      });

      if (mood === "sad" || mood === "miss") {
        setShowMemoryReminder(true);
      }
    } catch (caught) {
      console.error("[home] mood update failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setBusyMood(null);
    }
  };

  const reminder = useMemo(() => dashboard?.memory_reminders?.[0], [dashboard?.memory_reminders]);

  return (
    <div className="space-y-6 px-6 py-6">
      <PositiveMemoryReminder
        reminder={reminder}
        show={showMemoryReminder}
        onClose={() => setShowMemoryReminder(false)}
      />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-2 pt-8 text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">{dashboard?.relationship?.partner_one_name ?? "Partner 1"}</span>
          <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
          <span className="text-2xl">{dashboard?.relationship?.partner_two_name ?? "Partner 2"}</span>
        </div>
        <p className="text-sm text-gray-500">
          {dashboard?.relationship?.tagline ?? "Together and growing"}
        </p>
      </motion.div>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      <UpcomingBirthdayList
        birthdays={birthdays}
        onOpenMemory={() => navigate("/memories")}
        onWriteMessage={() => navigate("/add-entry")}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-white p-5 shadow-md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">How are you today?</span>
            <span className="text-right text-sm text-gray-600">
              {dashboard?.partner?.name ?? "Partner"} is: {dashboard?.partner?.today_mood ?? "not checked in yet"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {moods.map((mood) => {
              const Icon = mood.icon;
              const isSelected = dashboard?.current_user?.today_mood === mood.id;

              return (
                <button
                  key={mood.id}
                  onClick={() => void handleMoodSelect(mood.id)}
                  disabled={busyMood === mood.id}
                  className={`rounded-xl p-3 transition-all ${
                    isSelected ? `${mood.color} scale-95` : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  } ${busyMood === mood.id ? "opacity-60" : ""}`}
                >
                  <Icon className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-xs">{mood.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {dashboard?.relationship?.next_milestone && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-amber-100 to-orange-100 p-4"
        >
          <Calendar className="h-5 w-5 flex-shrink-0 text-amber-700" />
          <div className="flex-1">
            <div className="text-sm text-amber-900">{dashboard.relationship.next_milestone.label}</div>
            <div className="text-xs text-amber-700">
              Coming up in {dashboard.relationship.next_milestone.days_remaining} days
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl bg-gradient-to-br from-rose-100 to-pink-100 p-8 shadow-lg"
      >
        <div className="space-y-4 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="text-lg text-gray-700">Our Time Together</h2>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-3xl text-rose-600">{timeElapsed.days}</div>
              <div className="text-xs text-gray-600">days</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl text-rose-600">{timeElapsed.hours}</div>
              <div className="text-xs text-gray-600">hours</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl text-rose-600">{timeElapsed.minutes}</div>
              <div className="text-xs text-gray-600">mins</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl text-rose-600">{timeElapsed.seconds}</div>
              <div className="text-xs text-gray-600">secs</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl bg-white p-6 shadow-md"
      >
        <p className="text-center italic text-gray-600">
          "{dashboard?.relationship?.home_quote ?? "Every moment with you matters."}"
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => navigate("/add-entry")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white shadow-lg transition-transform active:scale-[0.98]"
      >
        <PlusCircle className="h-5 w-5" />
        Write Something Special
      </motion.button>

      <div className="grid grid-cols-2 gap-4">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate("/journal")}
          className="rounded-2xl bg-white p-6 shadow-md transition-transform active:scale-[0.98]"
        >
          <div className="space-y-2 text-center">
            <BookHeart className="mx-auto h-8 w-8 text-rose-500" />
            <div className="text-sm text-gray-700">Our Journal</div>
          </div>
        </motion.button>

        <motion.button
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate("/memories")}
          className="rounded-2xl bg-white p-6 shadow-md transition-transform active:scale-[0.98]"
        >
          <div className="space-y-2 text-center">
            <Image className="mx-auto h-8 w-8 text-pink-500" />
            <div className="text-sm text-gray-700">Memories</div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
