import { auth } from "@/auth";
import { Main } from "@/components/main";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { shouldSkipAuth } from "@/lib/env-utils";

export default async function Page() {
  // Skip authentication in Vercel preview environments
  if (shouldSkipAuth()) {
    return <Main />;
  }

  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => {
      redirect("/sign-in");
    });
  if (!session?.user) redirect("/sign-in");

  return <Main />;
}
