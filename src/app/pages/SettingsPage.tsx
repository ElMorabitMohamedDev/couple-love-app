import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bell, Calendar, ChevronRight, Heart, Lock, LogOut, Users } from "lucide-react";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Relationship } from "../lib/types";

type ActivePanel = "password" | "relationship" | "preferences" | null;

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout, refreshSession, relationship: sessionRelationship, token, user } = useAuth();
  const [relationship, setRelationship] = useState<Relationship | null>(sessionRelationship);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [relationshipForm, setRelationshipForm] = useState({
    title: "",
    tagline: "",
    partner_one_name: "",
    partner_two_name: "",
    started_at: "",
    future_children_slots: 3,
    home_quote: "",
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(user?.notifications_enabled ?? true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRelationship = useCallback(async () => {
    if (!token) {
      return;
    }

    const payload = await apiFetch<Relationship>("/relationship", { token });
    setRelationship(payload);
    setRelationshipForm({
      title: payload.title ?? "",
      tagline: payload.tagline ?? "",
      partner_one_name: payload.partner_one_name ?? "",
      partner_two_name: payload.partner_two_name ?? "",
      started_at: payload.started_at ?? "",
      future_children_slots: payload.future_children_slots ?? 3,
      home_quote: payload.home_quote ?? "",
    });
  }, [token]);

  useEffect(() => {
    setRelationship(sessionRelationship);
  }, [sessionRelationship]);

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
        setRelationshipForm({
          title: payload.title ?? "",
          tagline: payload.tagline ?? "",
          partner_one_name: payload.partner_one_name ?? "",
          partner_two_name: payload.partner_two_name ?? "",
          started_at: payload.started_at ?? "",
          future_children_slots: payload.future_children_slots ?? 3,
          home_quote: payload.home_quote ?? "",
        });
      } catch (caught) {
        if (active) {
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
      enabled: Boolean(token) && !activePanel && !busy,
      intervalMs: 30000,
    }
  );

  useEffect(() => {
    setNotificationsEnabled(user?.notifications_enabled ?? true);
  }, [user?.notifications_enabled]);

  const settingsGroups = useMemo(
    () => [
      {
        title: "Account",
        items: [
          { icon: Lock, label: "Change Shared Password", panel: "password" as const },
          { icon: Heart, label: "Relationship Details", panel: "relationship" as const },
          { icon: Calendar, label: "Anniversary Date", panel: "relationship" as const },
        ],
      },
      {
        title: "Features",
        items: [
          { icon: Users, label: "Family Tree", action: () => navigate("/family") },
        ],
      },
      {
        title: "Preferences",
        items: [
          { icon: Bell, label: "Notifications", panel: "preferences" as const },
        ],
      },
    ],
    [navigate]
  );

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    try {
      setBusy("password");
      setError(null);
      setMessage(null);

      await apiFetch("/settings/password", {
        method: "PUT",
        token,
        body: {
          password,
          password_confirmation: passwordConfirmation,
        },
      });

      setPassword("");
      setPasswordConfirmation("");
      setMessage("Shared password updated successfully.");
      setActivePanel(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const handleRelationshipUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    try {
      setBusy("relationship");
      setError(null);
      setMessage(null);

      const payload = await apiFetch<Relationship>("/relationship", {
        method: "PUT",
        token,
        body: relationshipForm,
      });

      setRelationship(payload);
      await refreshSession();
      setMessage("Relationship details updated successfully.");
      setActivePanel(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const handlePreferencesUpdate = async () => {
    if (!token) {
      return;
    }

    try {
      setBusy("preferences");
      setError(null);
      setMessage(null);

      await apiFetch("/settings/preferences", {
        method: "PUT",
        token,
        body: {
          notifications_enabled: !notificationsEnabled,
        },
      });

      setNotificationsEnabled((value) => !value);
      await refreshSession();
      setMessage("Preferences updated successfully.");
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh p-6">
      <div className="mb-8 pt-4">
        <h1 className="text-2xl text-gray-800">Settings</h1>
      </div>

      {(error || message) && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </div>
      )}

      <div className="space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: groupIndex * 0.08 }}
            className="space-y-3"
          >
            <h2 className="px-2 text-sm text-gray-500">{group.title}</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-md">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                const action = "action" in item ? item.action : () => setActivePanel(item.panel);

                return (
                  <button
                    key={item.label}
                    onClick={action}
                    className={`flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                      index !== group.items.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {activePanel === "password" && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
            <h3 className="text-lg text-gray-800">Change Shared Password</h3>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New shared password"
              className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
            />
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="Confirm new shared password"
              className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setActivePanel(null)} className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={busy === "password"} className="flex-1 rounded-2xl bg-rose-500 py-3 text-white disabled:opacity-60">
                {busy === "password" ? "Saving..." : "Save Password"}
              </button>
            </div>
          </form>
        )}

        {activePanel === "relationship" && (
          <form onSubmit={handleRelationshipUpdate} className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
            <h3 className="text-lg text-gray-800">Relationship Details</h3>
            <input
              value={relationshipForm.title}
              onChange={(event) => setRelationshipForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <input
              value={relationshipForm.tagline}
              onChange={(event) => setRelationshipForm((current) => ({ ...current, tagline: event.target.value }))}
              placeholder="Tagline"
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <input
              value={relationshipForm.partner_one_name}
              onChange={(event) => setRelationshipForm((current) => ({ ...current, partner_one_name: event.target.value }))}
              placeholder="Partner one name"
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <input
              value={relationshipForm.partner_two_name}
              onChange={(event) => setRelationshipForm((current) => ({ ...current, partner_two_name: event.target.value }))}
              placeholder="Partner two name"
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <input
              type="date"
              value={relationshipForm.started_at}
              onChange={(event) => setRelationshipForm((current) => ({ ...current, started_at: event.target.value }))}
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <input
              type="number"
              min={0}
              max={10}
              value={relationshipForm.future_children_slots}
              onChange={(event) =>
                setRelationshipForm((current) => ({
                  ...current,
                  future_children_slots: Number(event.target.value || 0),
                }))
              }
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <textarea
              value={relationshipForm.home_quote}
              onChange={(event) => setRelationshipForm((current) => ({ ...current, home_quote: event.target.value }))}
              placeholder="Home quote"
              rows={4}
              className="w-full resize-none rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setActivePanel(null)} className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={busy === "relationship"} className="flex-1 rounded-2xl bg-pink-500 py-3 text-white disabled:opacity-60">
                {busy === "relationship" ? "Saving..." : "Save Details"}
              </button>
            </div>
          </form>
        )}

        {activePanel === "preferences" && (
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
            <h3 className="text-lg text-gray-800">Preferences</h3>
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
              <div>
                <div className="text-gray-800">Notifications</div>
                <div className="text-sm text-gray-500">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
              <button
                onClick={() => void handlePreferencesUpdate()}
                disabled={busy === "preferences"}
                className={`rounded-full px-4 py-2 text-sm text-white ${
                  notificationsEnabled ? "bg-emerald-500" : "bg-gray-400"
                } disabled:opacity-60`}
              >
                {busy === "preferences" ? "Saving..." : notificationsEnabled ? "Turn Off" : "Turn On"}
              </button>
            </div>
          </div>
        )}

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="pt-4">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 text-rose-600 shadow-md transition-colors hover:bg-rose-50 active:bg-rose-100"
          >
            <LogOut className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        </motion.div>

        {relationship && (
          <div className="pt-2 text-center text-xs text-gray-400">
            <p>{relationship.partner_one_name} and {relationship.partner_two_name}</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
