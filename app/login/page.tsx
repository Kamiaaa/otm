import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/app/components/forms/LoginForm";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  await connectDB();
  const adminCount = await User.countDocuments({ role: "admin" });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* Replaced emoji with Next.js Image */}
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
          <h1 className="text-xl font-bold text-slate-900">Office Transport Management</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
        </div>

        {registered === "closed" && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2">
            An admin account already exists, so registration is closed. Please log in, or ask your admin to create your account.
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <LoginForm />
        </div>

        {/* {adminCount === 0 && (
          <p className="text-center text-sm text-slate-500 mt-4">
            No admin account yet?{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              Set one up
            </Link>
          </p>
        )} */}
      </div>
    </div>
  );
}