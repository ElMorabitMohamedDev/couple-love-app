import type { FormEvent } from "react";

interface SettingsFormValues {
  title: string;
  tagline: string;
  partner_one_name: string;
  partner_two_name: string;
  started_at: string;
  future_children_slots: number;
  home_quote: string;
}

interface PasswordPanelProps {
  busy: boolean;
  password: string;
  passwordConfirmation: string;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmationChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PasswordPanel({
  busy,
  password,
  passwordConfirmation,
  onPasswordChange,
  onPasswordConfirmationChange,
  onCancel,
  onSubmit,
}: PasswordPanelProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
      <h3 className="text-lg text-gray-800">Change Shared Password</h3>
      <input
        type="password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="New shared password"
        className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
      />
      <input
        type="password"
        value={passwordConfirmation}
        onChange={(event) => onPasswordConfirmationChange(event.target.value)}
        placeholder="Confirm new shared password"
        className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 outline-none focus:border-rose-400"
      />
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="flex-1 rounded-2xl bg-rose-500 py-3 text-white disabled:opacity-60">
          {busy ? "Saving..." : "Save Password"}
        </button>
      </div>
    </form>
  );
}

interface RelationshipPanelProps {
  busy: boolean;
  form: SettingsFormValues;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (patch: Partial<SettingsFormValues>) => void;
}

export function RelationshipPanel({ busy, form, onCancel, onSubmit, onFormChange }: RelationshipPanelProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
      <h3 className="text-lg text-gray-800">Relationship Details</h3>
      <input
        value={form.title}
        onChange={(event) => onFormChange({ title: event.target.value })}
        placeholder="Title"
        className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <input
        value={form.tagline}
        onChange={(event) => onFormChange({ tagline: event.target.value })}
        placeholder="Tagline"
        className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <input
        value={form.partner_one_name}
        onChange={(event) => onFormChange({ partner_one_name: event.target.value })}
        placeholder="Partner one name"
        className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <input
        value={form.partner_two_name}
        onChange={(event) => onFormChange({ partner_two_name: event.target.value })}
        placeholder="Partner two name"
        className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <input
        type="date"
        value={form.started_at}
        onChange={(event) => onFormChange({ started_at: event.target.value })}
        className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <input
        type="number"
        min={0}
        max={10}
        value={form.future_children_slots}
        onChange={(event) =>
          onFormChange({
            future_children_slots: Number(event.target.value || 0),
          })
        }
        className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <textarea
        value={form.home_quote}
        onChange={(event) => onFormChange({ home_quote: event.target.value })}
        placeholder="Home quote"
        rows={4}
        className="w-full resize-none rounded-2xl border-2 border-pink-100 bg-pink-50/50 px-4 py-3 outline-none focus:border-pink-400"
      />
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-700">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="flex-1 rounded-2xl bg-pink-500 py-3 text-white disabled:opacity-60">
          {busy ? "Saving..." : "Save Details"}
        </button>
      </div>
    </form>
  );
}

interface PreferencesPanelProps {
  busy: boolean;
  enabled: boolean;
  onToggle: () => void;
}

export function PreferencesPanel({ busy, enabled, onToggle }: PreferencesPanelProps) {
  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
      <h3 className="text-lg text-gray-800">Preferences</h3>
      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
        <div>
          <div className="text-gray-800">Notifications</div>
          <div className="text-sm text-gray-500">{enabled ? "Enabled" : "Disabled"}</div>
        </div>
        <button
          onClick={onToggle}
          disabled={busy}
          className={`rounded-full px-4 py-2 text-sm text-white ${enabled ? "bg-emerald-500" : "bg-gray-400"} disabled:opacity-60`}
        >
          {busy ? "Saving..." : enabled ? "Turn Off" : "Turn On"}
        </button>
      </div>
    </div>
  );
}

export type { SettingsFormValues };
