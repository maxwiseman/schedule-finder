import { notFound } from "next/navigation";
import DbPageClient from "./db-page-client";

export default function DbPage() {
  // Block access in production
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return <DbPageClient />;
}
