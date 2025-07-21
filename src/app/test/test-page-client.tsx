"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/test", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl bg-background min-h-screen">
      <Card className="mb-6 terminal-animate-in">
        <CardHeader>
          <CardTitle>Schedule Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="image-upload"
              className="block text-sm font-medium font-mono mb-2 terminal-prompt"
            >
              Upload Schedule Image
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground font-mono file:mr-4 file:py-2 file:px-4 file:border file:border-border file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 file:font-mono file:uppercase file:tracking-wide"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Process Schedule"}
          </Button>

          <div className="text-sm text-muted-foreground font-mono">
            <p className="terminal-list-item">
              This will create a random fake user and process the schedule under
              that user.
            </p>
            <p className="terminal-list-item">
              Check{" "}
              <a
                href="/test/db"
                className="text-primary hover:underline font-bold"
              >
                /test/db
              </a>{" "}
              to see the database contents.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive terminal-slide-in">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive font-mono">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="terminal-slide-in">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Created User */}
            {result.testUser && (
              <div>
                <h3 className="font-semibold mb-2 font-mono uppercase tracking-wide terminal-header">
                  Created Test User
                </h3>
                <div className="bg-muted/50 p-3 border border-border">
                  <p className="font-mono">
                    <span className="font-medium text-primary">Name:</span>{" "}
                    {result.testUser.name}
                  </p>
                  <p className="font-mono">
                    <span className="font-medium text-primary">Email:</span>{" "}
                    {result.testUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    <span className="font-medium text-primary">ID:</span>{" "}
                    {result.testUser.id}
                  </p>
                </div>
              </div>
            )}

            {/* Initial Validation */}
            <div>
              <h3 className="font-semibold mb-2 font-mono uppercase tracking-wide terminal-header">
                Initial Validation
              </h3>
              <p className="font-mono">
                Valid: {result.initialValidation?.isValid ? "Yes" : "No"}
              </p>
              <p className="font-mono">
                Confidence:{" "}
                {Math.round((result.initialValidation?.confidence || 0) * 100)}%
              </p>
              {result.initialValidation?.issues?.length > 0 && (
                <div>
                  <p className="font-medium font-mono text-primary">Issues:</p>
                  <ul className="list-none">
                    {result.initialValidation.issues.map(
                      (issue: string, idx: number) => (
                        <li
                          key={idx}
                          className="font-mono text-muted-foreground terminal-list-item"
                        >
                          {issue}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Extracted Data */}
            {result.extractedData && (
              <div>
                <h3 className="font-semibold mb-2 font-mono uppercase tracking-wide terminal-header">
                  Extracted Schedule
                </h3>
                <table className="w-full p-8 border font-mono">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 uppercase tracking-wide">
                        Period
                      </th>
                      <th className="text-left p-2 text-red-400 uppercase tracking-wide">
                        Red Day
                      </th>
                      <th className="text-left p-2 text-blue-400 uppercase tracking-wide">
                        Blue Day
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      "firstPeriod",
                      "secondPeriod",
                      "thirdPeriod",
                      "fourthPeriod",
                    ].map((period, idx) => {
                      const periodData = result.extractedData[period];
                      return (
                        <tr key={period} className="border-b border-border">
                          <td className="p-2 font-medium">{idx + 1}</td>
                          <td className="p-2">
                            {periodData?.redDay ? (
                              <div>
                                <div className="font-medium">
                                  {periodData.redDay.courseName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {periodData.redDay.teacherName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {periodData.redDay.courseCode}
                                  {periodData.redDay.roomNumber &&
                                    ` • ${periodData.redDay.roomNumber}`}
                                </div>
                              </div>
                            ) : periodData?.redDay === null ? (
                              <div className="text-muted-foreground italic">
                                <div className="font-medium">Free Period</div>
                                <div className="text-xs">
                                  No class scheduled
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                No data
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {periodData?.blueDay ? (
                              <div>
                                <div className="font-medium">
                                  {periodData.blueDay.courseName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {periodData.blueDay.teacherName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {periodData.blueDay.courseCode}
                                  {periodData.blueDay.roomNumber &&
                                    ` • ${periodData.blueDay.roomNumber}`}
                                </div>
                              </div>
                            ) : periodData?.blueDay === null ? (
                              <div className="text-muted-foreground italic">
                                <div className="font-medium">Free Period</div>
                                <div className="text-xs">
                                  No class scheduled
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                No data
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {result.extractedData.advisory && (
                      <tr className="border-b border-border">
                        <td className="p-2 font-medium">Advisory</td>
                        <td className="p-2 text-center" colSpan={2}>
                          <div>
                            <div className="font-medium">
                              {result.extractedData.advisory.teacherName}
                            </div>
                            {result.extractedData.advisory.roomNumber && (
                              <div className="text-xs text-muted-foreground">
                                {result.extractedData.advisory.roomNumber}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Database Result */}
            {result.scheduleId && (
              <div>
                <h3 className="font-semibold mb-2 font-mono uppercase tracking-wide terminal-header">
                  Database
                </h3>
                <p className="font-mono">
                  Schedule saved with ID: {result.scheduleId}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  View all data at{" "}
                  <a
                    href="/test/db"
                    className="text-primary hover:underline font-bold"
                  >
                    /test/db
                  </a>
                </p>
              </div>
            )}

            {result.databaseError && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive font-mono uppercase tracking-wide">
                  Database Error
                </h3>
                <p className="text-destructive font-mono">
                  {result.databaseError}
                </p>
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-4">
              <summary className="font-semibold cursor-pointer font-mono uppercase tracking-wide terminal-prompt">
                Raw JSON Data
              </summary>
              <pre className="mt-2 p-4 bg-muted border border-border text-sm overflow-auto font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
