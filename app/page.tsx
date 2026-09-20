import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  await connectDB();
  const adminCount = await User.countDocuments({ role: "admin" });
  redirect(adminCount === 0 ? "/register" : "/login");
}
