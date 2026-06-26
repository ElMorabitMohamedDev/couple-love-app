import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Bell, Calendar, Heart, Lock, LogOut, Users } from "lucide-react";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { apiFetch, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Relationship } from "../lib/types";
import {
  PasswordPanel,
  PreferencesPanel,
  RelationshipPanel,
  type SettingsFormValues,
} from "./settings/SettingsPanels";
import { SettingsMenu, type SettingsMenuGroup } from "./settings/SettingsMenu";

type ActivePanel = "password" | "relationship" | "preferences" | null;

function createRelationshipForm(payload: Relationship): SettingsFormValues {
  return {
    title: payload.title ?? "",
    tagline: payload.tagline ?? "",
    partner_one_name: payload.partner_one_name ?? "",
    partner_two_name: payload.partner_two_name ?? "",
    started_at: payload.started_at ?? "",
    future_children_slots: payload.future_children_slots ?? 3,
    home_quote: payload.home_quote ?? "",
  };
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout, refreshSession, relationship: sessionRelationship, token, user } = useAuth();
  const [relationship, setRelationship] = useState<Relationship | null>(sessionRelationship);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [relationshipForm, setRelationshipForm] = useState<SettingsFormValues>({
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
    setRelationshipForm(createRelationshipForm(payload));
  }, [token]);

  useEffect(() => {
    setRelationship(sessionRelationship);
    if (sessionRelationship) {
      setRelationshipForm(createRelationshipForm(sessionRelationship));
    }
  }, [sessionRelationship]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const hydrateRelationship = async () => {
      try {
        await loadRelationship();
      } catch (caught) {
        if (active) {
          setError(getApiErrorMessage(caught));
        }
      }
    };

    void hydrateRelationship();

    return () => {
      active = false;
    };
  }, [loadRelationship, token]);

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

  const settingsGroups: SettingsMenuGroup[] = useMemo(
    () => [
      {
        title: "Account",
        items: [
          { icon: Lock, label: "Change Shared Password", onClick: () => setActivePanel("password") },
          { icon: Heart, label: "Relationship Details", onClick: () => setActivePanel("relationship") },
          { icon: Calendar, label: "Anniversary Date", onClick: () => setActivePanel("relationship") },
        ],
      },
      {
        title: "Features",
        items: [{ icon: Users, label: "Family Tree", onClick: () => navigate("/family") }],
      },
      {
        title: "Preferences",
        items: [{ icon: Bell, label: "Notifications", onClick: () => setActivePanel("preferences") }],
      },
    ],
    [navigate]
  );

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleRelationshipUpdate = async (event: FormEvent<HTMLFormElement>) => {
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
      setRelationshipForm(createRelationshipForm(payload));
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
        <div
          className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
            error ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <SettingsMenu groups={settingsGroups} />

      {activePanel === "password" && (
        <PasswordPanel
          busy={busy === "password"}
          password={password}
          passwordConfirmation={passwordConfirmation}
          onPasswordChange={setPassword}
          onPasswordConfirmationChange={setPasswordConfirmation}
          onCancel={() => setActivePanel(null)}
          onSubmit={handlePasswordUpdate}
        />
      )}

      {activePanel === "relationship" && (
        <RelationshipPanel
          busy={busy === "relationship"}
          form={relationshipForm}
          onCancel={() => setActivePanel(null)}
          onSubmit={handleRelationshipUpdate}
          onFormChange={(patch) => setRelationshipForm((current) => ({ ...current, ...patch }))}
        />
      )}

      {activePanel === "preferences" && (
        <PreferencesPanel
          busy={busy === "preferences"}
          enabled={notificationsEnabled}
          onToggle={() => void handlePreferencesUpdate()}
        />
      )}

      <div className="pt-4">
        <button
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 text-rose-600 shadow-md transition-colors hover:bg-rose-50 active:bg-rose-100"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>

      {relationship && (
        <div className="pt-4 text-center text-xs text-gray-400">
          <p>
            {relationship.partner_one_name} and {relationship.partner_two_name}
          </p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      )}
    </div>
  );
}
