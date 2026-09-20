import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import RegisterForm from "@/app/components/forms/RegisterForm";
import Image from "next/image";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  await connectDB();
  const adminCount = await User.countDocuments({ role: "admin" });

  // Bootstrap-only: once any admin exists, registration is closed.
  if (adminCount > 0) {
    redirect("/login?registered=closed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="relative h-10 w-32 sm:h-12 sm:w-36 lg:h-14 lg:w-44 mx-auto">
            <Image
              src="/globe.svg"
              alt="Lithium Battery Company Logo"
              fill
              loading="eager"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set Up Your Admin Account</h1>
          <p className="text-sm text-slate-500 mt-1">
            No admin exists yet — create the first one to get started.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
