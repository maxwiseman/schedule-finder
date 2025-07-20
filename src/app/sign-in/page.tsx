"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export default function Page() {
  return (
    <main className="size-full flex justify-center items-center">
      <Button
        onClick={() => {
          signIn.social({ provider: "google" });
        }}
        variant="outline"
      >
        Sign in with Google
      </Button>
    </main>
  );
}
