import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Lock, Users } from "lucide-react";
import { API_URL, apiFetch, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { AuthOptionsPayload } from "../lib/types";

export function LoginPage() {
  const navigate = useNavigate();
  const { error: sessionError, isAuthenticated, login } = useAuth();
  const [options, setOptions] = useState<AuthOptionsPayload | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [setupForm, setSetupForm] = useState({
    partner_one_name: "",
    partner_two_name: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const payload = await apiFetch<AuthOptionsPayload>("/auth/options");

        if (!active) {
          return;
        }

        setOptions(payload);
        setSelectedUserId((current) => current ?? payload.users[0]?.id ?? null);
        setSetupForm((current) => ({
          ...current,
          partner_one_name: current.partner_one_name || payload.users[0]?.name || "",
          partner_two_name: current.partner_two_name || payload.users[1]?.name || "",
        }));
        setError(null);
      } catch (caught) {
        if (active) {
          console.error("[login] options failed", caught);
          setError(getApiErrorMessage(caught));
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId) {
      setError("Choose who you are before entering the shared password.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      await login(selectedUserId, password);
      navigate("/home", { replace: true });
    } catch (caught) {
      console.error("[login] failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      const payload = await apiFetch<AuthOptionsPayload>("/auth/setup", {
        method: "POST",
        body: setupForm,
      });

      setOptions(payload);
      setSelectedUserId(payload.users[0]?.id ?? null);
      setPassword(setupForm.password);
      setMessage("Your private space is ready. Pick your name and enter together.");
    } catch (caught) {
      console.error("[login] setup failed", caught);
      setError(getApiErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const isSetupMode = options?.requires_setup ?? false;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex rounded-[2rem] bg-white p-5 shadow-xl shadow-rose-200/50">
            <Heart className="h-16 w-16 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl text-gray-800">Our Love Space</h1>
            <p className="mt-2 text-gray-500">
              {isSetupMode ? "Set up your private space for the two of you" : "A private place for just the two of you"}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/90 p-6 shadow-xl">
          {loadingOptions ? (
            <p className="text-center text-sm text-gray-500">Preparing your space...</p>
          ) : isSetupMode ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Enter both names once, choose one shared password, and your private space will be ready.
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Partner one</label>
                <input
                  value={setupForm.partner_one_name}
                  onChange={(event) => setSetupForm((current) => ({ ...current, partner_one_name: event.target.value }))}
                  placeholder="First name"
                  className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 text-gray-800 outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Partner two</label>
                <input
                  value={setupForm.partner_two_name}
                  onChange={(event) => setSetupForm((current) => ({ ...current, partner_two_name: event.target.value }))}
                  placeholder="Second name"
                  className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 text-gray-800 outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Shared password</label>
                <input
                  type="password"
                  value={setupForm.password}
                  onChange={(event) => setSetupForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 text-gray-800 outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Confirm shared password</label>
                <input
                  type="password"
                  value={setupForm.password_confirmation}
                  onChange={(event) => setSetupForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                  placeholder="Repeat the password"
                  className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 text-gray-800 outline-none focus:border-rose-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Create Our Space"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Who are you?</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {options?.users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`rounded-2xl border-2 px-4 py-4 text-sm transition-all active:scale-[0.98] ${
                        selectedUserId === user.id
                          ? "border-rose-400 bg-rose-50 text-rose-600"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="h-4 w-4" />
                  <span>Shared password</span>
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter the password you share"
                  className="w-full rounded-2xl border-2 border-rose-100 bg-rose-50/50 px-4 py-3 text-gray-800 outline-none transition-colors focus:border-rose-400"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedUserId || password.length < 6 || submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Opening..." : "Enter Our Space"}
              </button>
            </form>
          )}

          {(error || sessionError || message) && (
            <div className="mt-4 space-y-2">
              {(error || sessionError) && (
                <p className="text-sm text-rose-500">{error ?? sessionError}</p>
              )}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              <p className="text-xs text-rose-400">API URL: {API_URL}</p>
            </div>
          )}
        </div>

        <div className="space-y-1 text-center text-xs text-gray-400">
          <p>Only two private profiles are allowed</p>
          <p>Current API: {API_URL}</p>
        </div>
      </motion.div>
    </div>
  );
}
