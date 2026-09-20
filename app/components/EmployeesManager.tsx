"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserLean, UserRole } from "@/types";
import StatusBadge from "@/app/components/StatusBadge";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "employee" as UserRole,
  department: "",
  phone: "",
  active: true,
};

export default function EmployeesManager({
  employees,
  currentUserId,
}: {
  employees: UserLean[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  function startEdit(emp: UserLean) {
    setEditingId(emp._id);
    setForm({
      name: emp.name,
      email: emp.email,
      password: "",
      role: emp.role,
      department: emp.department || "",
      phone: emp.phone || "",
      active: emp.active,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
      const method = editingId ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { ...form };
      if (editingId && !form.password) delete payload.password;
      if (editingId) delete payload.email; // email not editable after creation

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save employee");
        return;
      }
      resetForm();
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this employee? This cannot be undone.")) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.refresh();
    else alert(data.error || "Failed to delete employee");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          {editingId ? "Edit employee" : "Add a new employee / admin"}
        </h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input required placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          <input required type="email" disabled={!!editingId} placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`${inputClass} ${editingId ? "bg-slate-100 text-slate-500" : ""}`} />
          <input
            type="password"
            placeholder={editingId ? "New password (optional)" : "Password"}
            required={!editingId}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={inputClass}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input placeholder="Department" value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputClass} />
          <input placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (can log in)
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update Employee" : "Add Employee"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Department</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{emp.role}</td>
                <td className="px-4 py-3 text-slate-600">{emp.department || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={emp.active ? "available" : "inactive"} />
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => startEdit(emp)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  {emp._id !== currentUserId && (
                    <button onClick={() => handleDelete(emp._id)} className="text-red-600 hover:underline font-medium">Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No employees added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
