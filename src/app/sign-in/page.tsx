"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";
import { AlertTriangle, ExternalLink } from "lucide-react";

// Component to detect Snapchat browser and show warning
function SnapchatWarning() {
  const [isSnapchatBrowser, setIsSnapchatBrowser] = useState(false);

  useEffect(() => {
    // Check if user agent contains "Snapchat"
    const userAgent = navigator.userAgent.toLowerCase();
    const isSnapchat = userAgent.includes("snapchat");
    setIsSnapchatBrowser(isSnapchat);
  }, []);

  if (!isSnapchatBrowser) {
    return null;
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg font-mono before:hidden uppercase tracking-wide text-yellow-500">
            Browser Not Supported
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground font-mono">
          You're using Snapchat's in-app browser, which doesn't support Google
          sign-in.
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          To use this app:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground font-mono">
          <li>Tap the three dots (⋯) in the top right corner</li>
          <li>Select "Open in Browser"</li>
          <li>Try signing in again</li>
        </ol>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [isSnapchatBrowser, setIsSnapchatBrowser] = useState(false);

  useEffect(() => {
    // Check if user agent contains "Snapchat"
    const userAgent = navigator.userAgent.toLowerCase();
    const isSnapchat = userAgent.includes("snapchat");
    setIsSnapchatBrowser(isSnapchat);
  }, []);

  return (
    <main className="size-full flex justify-center items-center p-4">
      <div className="w-full max-w-md space-y-4">
        {isSnapchatBrowser ? (
          <SnapchatWarning />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-xl font-mono uppercase tracking-wide">
                    Schedule Matcher
                  </h1>
                  <p className="text-sm text-muted-foreground font-mono">
                    Sign in to view your schedule and find classmates
                  </p>
                </div>
                <Button
                  onClick={() => {
                    signIn.social({ provider: "google" });
                  }}
                  variant="outline"
                  className="w-full font-mono uppercase tracking-wide"
                >
                  Sign in with Google
                </Button>
                <Card className="border-yellow-500/50 bg-yellow-500/10 p-4 text-xs text-left">
                  Don't use your school account to sign in
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
