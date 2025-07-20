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
    <div className="container mx-auto p-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Schedule Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="image-upload"
              className="block text-sm font-medium mb-2"
            >
              Upload Schedule Image
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Process Schedule"}
          </Button>

          <div className="text-sm text-gray-600">
            <p>
              This will create a random fake user and process the schedule under
              that user.
            </p>
            <p>
              Check{" "}
              <a href="/test/db" className="text-blue-600 hover:underline">
                /test/db
              </a>{" "}
              to see the database contents.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Created User */}
            {result.testUser && (
              <div>
                <h3 className="font-semibold mb-2">Created Test User</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {result.testUser.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {result.testUser.email}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">ID:</span>{" "}
                    {result.testUser.id}
                  </p>
                </div>
              </div>
            )}

            {/* Initial Validation */}
            <div>
              <h3 className="font-semibold mb-2">Initial Validation</h3>
              <p>Valid: {result.initialValidation?.isValid ? "Yes" : "No"}</p>
              <p>
                Confidence:{" "}
                {Math.round((result.initialValidation?.confidence || 0) * 100)}%
              </p>
              {result.initialValidation?.issues?.length > 0 && (
                <div>
                  <p className="font-medium">Issues:</p>
                  <ul className="list-disc list-inside">
                    {result.initialValidation.issues.map(
                      (issue: string, idx: number) => (
                        <li key={idx}>{issue}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Extracted Data */}
            {result.extractedData && (
              <div>
                <h3 className="font-semibold mb-2">Extracted Schedule</h3>
                <div className="border rounded-md p-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Period</th>
                        <th className="text-left p-2 text-red-600">Red Day</th>
                        <th className="text-left p-2 text-blue-600">
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
                          <tr key={period} className="border-b">
                            <td className="p-2 font-medium">{idx + 1}</td>
                            <td className="p-2">
                              {periodData?.redDay ? (
                                <div>
                                  <div className="font-medium">
                                    {periodData.redDay.courseName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {periodData.redDay.teacherName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {periodData.redDay.courseCode}
                                    {periodData.redDay.roomNumber &&
                                      ` • ${periodData.redDay.roomNumber}`}
                                  </div>
                                </div>
                              ) : periodData?.redDay === null ? (
                                <div className="text-gray-600 italic">
                                  <div className="font-medium">Free Period</div>
                                  <div className="text-xs">
                                    No class scheduled
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No data</span>
                              )}
                            </td>
                            <td className="p-2">
                              {periodData?.blueDay ? (
                                <div>
                                  <div className="font-medium">
                                    {periodData.blueDay.courseName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {periodData.blueDay.teacherName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {periodData.blueDay.courseCode}
                                    {periodData.blueDay.roomNumber &&
                                      ` • ${periodData.blueDay.roomNumber}`}
                                  </div>
                                </div>
                              ) : periodData?.blueDay === null ? (
                                <div className="text-gray-600 italic">
                                  <div className="font-medium">Free Period</div>
                                  <div className="text-xs">
                                    No class scheduled
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No data</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {result.extractedData.advisory && (
                        <tr className="border-b">
                          <td className="p-2 font-medium">Advisory</td>
                          <td className="p-2 text-center" colSpan={2}>
                            <div>
                              <div className="font-medium">
                                {result.extractedData.advisory.teacherName}
                              </div>
                              {result.extractedData.advisory.roomNumber && (
                                <div className="text-xs text-gray-500">
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
              </div>
            )}

            {/* Database Result */}
            {result.scheduleId && (
              <div>
                <h3 className="font-semibold mb-2">Database</h3>
                <p>Schedule saved with ID: {result.scheduleId}</p>
                <p className="text-sm text-gray-600">
                  View all data at{" "}
                  <a href="/test/db" className="text-blue-600 hover:underline">
                    /test/db
                  </a>
                </p>
              </div>
            )}

            {result.databaseError && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">
                  Database Error
                </h3>
                <p className="text-red-600">{result.databaseError}</p>
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-4">
              <summary className="font-semibold cursor-pointer">
                Raw JSON Data
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded-md text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
