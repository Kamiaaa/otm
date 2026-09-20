"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("New password must be different from your current password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md rounded-xl border border-slate-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
          Your password has been updated.
        </div>
      )}

      <div>
        <label className="block text-sm mb-1" htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          value={form.currentPassword}
          onChange={(e) => update("currentPassword", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="input"
          value={form.newPassword}
          onChange={(e) => update("newPassword", e.target.value)}
        />
        <p className="text-xs text-slate-500 mt-1">At least 6 characters.</p>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="input"
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Updating..." : "Update password"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.push("/dashboard")}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}