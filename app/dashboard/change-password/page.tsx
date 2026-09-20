import ChangePasswordForm from "@/app/components/forms/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter your current password, then choose a new one.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}