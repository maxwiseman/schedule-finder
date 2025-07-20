import { notFound } from "next/navigation";
import TestPageClient from "./test-page-client";

export default function TestPage() {
  // Block access in production
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return <TestPageClient />;
}
