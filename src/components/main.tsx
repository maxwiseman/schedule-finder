"use client";

import { ImageUpload } from "@/components/image-upload";
import { useState, useEffect } from "react";
import {
  useStreamGeneration,
  useScheduleData,
  type Period,
  type Advisory,
} from "@/lib/use-stream-generation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle, Users, Database, Terminal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScheduleTabs } from "./schedule-tabs/schedule-tabs";

export function Main() {
  const [stage, setStage] = useState<"upload" | "generating" | "results">(
    "upload"
  );
  const [files, setFiles] = useState<File[] | undefined>();
  const [isUserInitiatedReset, setIsUserInitiatedReset] = useState(false);
  const { data: session } = useSession();
  const { data, isGenerating, startGeneration, reset } = useStreamGeneration();
  const queryClient = useQueryClient();

  // Fetch existing schedule data if user is logged in
  const {
    data: existingData,
    isLoading: isLoadingExisting,
    refetch: refetchSchedule,
  } = useScheduleData(session?.user?.id || null);

  // Check if user has existing schedule data on initial mount only
  useEffect(() => {
    if (existingData?.schedule && stage === "upload" && !isUserInitiatedReset) {
      setStage("results");
    }
  }, [existingData, stage, isUserInitiatedReset]);

  // Handle validation failures - reset to upload with error
  useEffect(() => {
    if (
      stage === "generating" &&
      data.initialValidationStatus === "complete" &&
      data.initialValidationResult?.isValid === false
    ) {
      setStage("upload");
      setIsUserInitiatedReset(true);
    }
  }, [stage, data.initialValidationStatus, data.initialValidationResult]);

  const handleStartGeneration = async () => {
    if (!files?.[0] || !session?.user?.id) return;

    setStage("generating");
    reset(); // Clear any previous errors
    await startGeneration(files[0], session.user.id);

    // Invalidate and refetch schedule data after generation
    await queryClient.invalidateQueries({
      queryKey: ["schedule", session.user.id],
    });
    await refetchSchedule();

    setStage("results");
    setIsUserInitiatedReset(false); // Reset flag after successful upload
  };

  const handleReset = () => {
    setStage("upload");
    setFiles(undefined);
    setIsUserInitiatedReset(true);
    reset();
  };

  // Show login message if not authenticated
  if (!session?.user) {
    return (
      <main className="size-full gap-6 flex-col flex items-center justify-center p-8 bg-background">
        <div className="terminal-animate-in">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 terminal-list-item">
                You need to be signed in to upload and save your schedule.
              </p>
              <Button
                onClick={() => (window.location.href = "/sign-in")}
                className="w-full"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Show loading state while checking for existing data
  if (isLoadingExisting && stage === "upload") {
    return (
      <main className="size-full gap-6 flex-col flex items-center justify-center p-8 bg-background">
        <div className="terminal-animate-in">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="terminal-prompt">Checking for existing schedule...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const renderPeriodRow = (
    periodName: string,
    periodNumber: number,
    period: Period | undefined,
    isLoading: boolean = false
  ) => {
    // Helper function to render day content safely
    const renderDayContent = (
      dayData:
        | {
            courseCode: string;
            courseName: string;
            teacherName: string;
            roomNumber?: string;
          }
        | null
        | undefined,
      dayType: "red" | "blue"
    ) => {
      if (dayData === undefined) {
        return isLoading ? (
          <div className="space-y-1 animate-pulse">
            <div className="h-4 bg-muted w-20 terminal-slide-in"></div>
            <div className="h-3 bg-muted w-24 terminal-slide-in" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-3 bg-muted w-16 terminal-slide-in" style={{ animationDelay: '0.2s' }}></div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm terminal-list-item">No data</div>
        );
      }

      // Handle free period (null)
      if (dayData === null) {
        const freeKey = `FREE-FREE PERIOD-${periodNumber}-${dayType}`;
        const freeClassmates = existingData?.classmates?.[freeKey] || [];

        return (
          <div className="space-y-2 terminal-slide-in">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground italic">
                [FREE PERIOD]
              </div>
              <div className="text-xs text-muted-foreground">
                No class scheduled
              </div>
            </div>

            {/* Show classmates with free periods */}
            {freeClassmates.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Users className="h-3 w-3" />
                  <span>{freeClassmates.length} also free</span>
                </div>
                <div className="space-y-1">
                  {freeClassmates.slice(0, 3).map((classmate, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground terminal-list-item">
                      {classmate.userName}
                    </div>
                  ))}
                  {freeClassmates.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{freeClassmates.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Find classmates for this course - match API key format
      const courseKey = `${dayData.courseCode}-${dayData.teacherName}-${periodNumber}-${dayType}`;
      const classmates = existingData?.classmates?.[courseKey] || [];

      return (
        <div className="space-y-2 terminal-slide-in">
          <div className="space-y-1">
            <div className="font-medium">{dayData.courseName || "..."}</div>
            <div className="text-sm text-muted-foreground">
              {dayData.teacherName || "..."}
              {dayData.roomNumber && ` • ${dayData.roomNumber}`}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {dayData.courseCode || "..."}
            </div>
          </div>

          {/* Show classmates if any */}
          {classmates.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span>
                  {classmates.length} classmate
                  {classmates.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {classmates.slice(0, 3).map((classmate, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground terminal-list-item">
                    {classmate.userName}
                  </div>
                ))}
                {classmates.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{classmates.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    };

    const rowClass = isLoading ? "border-b border-border terminal-slide-in" : "border-b border-border";

    return (
      <tr className={rowClass} style={{ animationDelay: `${periodNumber * 0.1}s` }}>
        <td className="p-3 font-medium font-mono uppercase tracking-wide">{periodName}</td>
        <td className="p-3">{renderDayContent(period?.redDay, "red")}</td>
        <td className="p-3">{renderDayContent(period?.blueDay, "blue")}</td>
      </tr>
    );
  };

  const renderAdvisoryRow = (
    advisory: Advisory | undefined,
    isLoading: boolean = false
  ) => {
    if (isLoading) {
      return (
        <tr className="border-b border-border terminal-slide-in" style={{ animationDelay: '0.5s' }}>
          <td className="p-3 font-medium font-mono uppercase tracking-wide">Advisory</td>
          <td className="p-3 text-center" colSpan={2}>
            <div className="space-y-1 animate-pulse">
              <div className="h-4 bg-muted w-32 mx-auto"></div>
              <div className="h-3 bg-muted w-20 mx-auto"></div>
            </div>
          </td>
        </tr>
      );
    }

    if (!advisory) {
      return (
        <tr className="border-b border-border">
          <td className="p-3 font-medium font-mono uppercase tracking-wide">Advisory</td>
          <td className="p-3 text-center text-muted-foreground terminal-list-item" colSpan={2}>
            No data
          </td>
        </tr>
      );
    }

    // Find classmates for advisory - match API key format
    const advisoryKey = `ADV-${advisory.teacherName}-5-both`;
    const advisoryClassmates = existingData?.classmates?.[advisoryKey] || [];

    return (
      <tr className="border-b border-border terminal-slide-in">
        <td className="p-3 font-medium font-mono uppercase tracking-wide">Advisory</td>
        <td className="p-3 text-center" colSpan={2}>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium">{advisory.teacherName}</div>
              {advisory.roomNumber && (
                <div className="text-xs text-muted-foreground">
                  {advisory.roomNumber}
                </div>
              )}
            </div>

            {/* Show classmates if any */}
            {advisoryClassmates.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 justify-center">
                  <Users className="h-3 w-3" />
                  <span>
                    {advisoryClassmates.length} classmate
                    {advisoryClassmates.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  {advisoryClassmates.slice(0, 3).map((classmate, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-muted-foreground text-center terminal-list-item"
                    >
                      {classmate.userName}
                    </div>
                  ))}
                  {advisoryClassmates.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{advisoryClassmates.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Use existing data if available, otherwise use streaming data
  const currentScheduleData = existingData?.schedule || data.scheduleData;
  const hasAnyScheduleData =
    currentScheduleData.firstPeriod ||
    currentScheduleData.secondPeriod ||
    currentScheduleData.thirdPeriod ||
    currentScheduleData.fourthPeriod ||
    currentScheduleData.advisory;

  const shouldShowScheduleTable =
    hasAnyScheduleData || data.extractionStatus === "extracting";

  return (
    <main className="size-full gap-6 flex-col flex items-center p-8 bg-background min-h-screen">
      {stage === "upload" && (
        <div className="w-full max-w-md space-y-4 terminal-animate-in">
          {/* Error Display */}
          {data.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Upload Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive terminal-list-item">{data.error}</p>
                <p className="text-sm text-muted-foreground mt-2 terminal-list-item">
                  Please try again with a different image.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload Your Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 terminal-list-item">
                Upload a screenshot or photo of your class schedule to get started.
              </p>
              <ImageUpload
                files={files}
                setFiles={setFiles}
                nextStage={handleStartGeneration}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "generating" && (
        <div className="w-full max-w-4xl space-y-6 terminal-animate-in">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Processing Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground terminal-prompt">{data.status}</p>
            </CardContent>
          </Card>

          {/* Schedule Data */}
          {shouldShowScheduleTable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Schedule Data
                  {data.extractionStatus === "extracting" && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                  {data.extractionStatus === "complete" && (
                    <CheckCircle className="h-3 w-3 text-primary" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-border">
                  <table className="w-full font-mono">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="p-3 text-left w-24 uppercase tracking-wide">Period</th>
                        <th className="p-3 text-left text-red-400 uppercase tracking-wide">Red Day</th>
                        <th className="p-3 text-left text-blue-400 uppercase tracking-wide">Blue Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderPeriodRow(
                        "1st",
                        1,
                        currentScheduleData.firstPeriod,
                        data.extractionStatus === "extracting" &&
                          !currentScheduleData.firstPeriod
                      )}
                      {renderPeriodRow(
                        "2nd",
                        2,
                        currentScheduleData.secondPeriod,
                        data.extractionStatus === "extracting" &&
                          !currentScheduleData.secondPeriod
                      )}
                      {renderPeriodRow(
                        "3rd",
                        3,
                        currentScheduleData.thirdPeriod,
                        data.extractionStatus === "extracting" &&
                          !currentScheduleData.thirdPeriod
                      )}
                      {renderPeriodRow(
                        "4th",
                        4,
                        currentScheduleData.fourthPeriod,
                        data.extractionStatus === "extracting" &&
                          !currentScheduleData.fourthPeriod
                      )}
                      {renderAdvisoryRow(
                        currentScheduleData.advisory,
                        data.extractionStatus === "extracting" &&
                          !currentScheduleData.advisory
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Status */}
          {data.databaseStatus !== "idle" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {data.databaseStatus === "saving" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Saving to Database
                    </>
                  )}
                  {data.databaseStatus === "complete" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Saved Successfully
                    </>
                  )}
                  {data.databaseStatus === "error" && (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      Database Error
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm">
                    {data.databaseStatus === "saving" &&
                      "Saving your schedule..."}
                    {data.databaseStatus === "complete" &&
                      "Your schedule has been saved!"}
                    {data.databaseStatus === "error" &&
                      "Failed to save schedule"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {data.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive terminal-list-item">{data.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {stage === "results" && (
        <div className="w-full max-w-6xl space-y-6 terminal-animate-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Your Schedule & Classmates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline">
                  Upload New Schedule
                </Button>
                {existingData?.scheduleId && (
                  <Button
                    onClick={() => refetchSchedule()}
                    variant="outline"
                    disabled={isLoadingExisting}
                  >
                    {isLoadingExisting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Refresh Data
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Layout */}
          {hasAnyScheduleData && (
            <Card>
              <CardContent className="pt-6">
                <ScheduleTabs
                  scheduleData={currentScheduleData}
                  classmates={existingData?.classmates || {}}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
