import { auth } from "@/auth";
import { Main } from "@/components/main";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => {
      redirect("/sign-in");
    });
  if (!session?.user) redirect("/sign-in");

  return <Main />;
}
