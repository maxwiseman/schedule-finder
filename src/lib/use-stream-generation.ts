import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export interface Period {
  redDay: {
    courseCode: string;
    courseName: string;
    teacherName: string;
    roomNumber?: string;
  } | null;
  blueDay: {
    courseCode: string;
    courseName: string;
    teacherName: string;
    roomNumber?: string;
  } | null;
}

export interface Advisory {
  teacherName: string;
  roomNumber?: string;
}

export interface ScheduleData {
  firstPeriod?: Period;
  secondPeriod?: Period;
  thirdPeriod?: Period;
  fourthPeriod?: Period;
  advisory?: Advisory;
}

export interface StreamData {
  scheduleData: ScheduleData;
  initialValidationStatus: "idle" | "validating" | "complete";
  initialValidationResult?: {
    isValid: boolean;
    confidence: number;
    issues: string[];
  };
  extractionStatus: "idle" | "extracting" | "complete";
  databaseStatus: "idle" | "saving" | "complete" | "error";
  scheduleId?: number;
  status: string;
  error?: string;
}

export interface UseStreamGenerationReturn {
  data: StreamData;
  isGenerating: boolean;
  startGeneration: (file: File, userId: string) => Promise<void>;
  reset: () => void;
}

export function useStreamGeneration(): UseStreamGenerationReturn {
  const [data, setData] = useState<StreamData>({
    scheduleData: {},
    initialValidationStatus: "idle",
    extractionStatus: "idle",
    databaseStatus: "idle",
    status: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const startGeneration = useCallback(async (file: File, userId: string) => {
    setIsGenerating(true);
    setData({
      scheduleData: {},
      initialValidationStatus: "idle",
      extractionStatus: "idle",
      databaseStatus: "idle",
      status: "Starting...",
    });

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("userId", userId);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);

              setData((prevData) => {
                const newData = { ...prevData };

                switch (parsed.type) {
                  case "initial-validation":
                    if (parsed.data === "started") {
                      newData.initialValidationStatus = "validating";
                      newData.status =
                        "Validating image contains a schedule...";
                    } else if (parsed.data === "complete") {
                      newData.initialValidationStatus = "complete";
                      newData.initialValidationResult = parsed.result;
                      if (parsed.result.isValid) {
                        newData.status = "Image validated successfully";
                      } else {
                        newData.status = "Image validation failed";
                        newData.error = `Invalid image: ${
                          parsed.result.issues?.join(", ") ||
                          "Please upload an image containing a student schedule."
                        }`;
                      }
                    }
                    break;

                  case "data-extraction":
                    if (parsed.data === "started") {
                      newData.extractionStatus = "extracting";
                      newData.status = "Extracting schedule data...";
                    } else if (parsed.data === "complete") {
                      newData.extractionStatus = "complete";
                      newData.scheduleData = parsed.result;
                      newData.status = "Schedule data extracted";
                    }
                    break;

                  case "json_partial":
                    // Merge the partial object with existing data
                    newData.scheduleData = {
                      ...newData.scheduleData,
                      ...parsed.data,
                    };
                    break;

                  case "database":
                    if (parsed.data === "saving") {
                      newData.databaseStatus = "saving";
                      newData.status = "Saving to database...";
                    } else if (parsed.data === "complete") {
                      newData.databaseStatus = "complete";
                      newData.scheduleId = parsed.scheduleId;
                      newData.status = "Processing complete";
                    } else if (parsed.data === "error") {
                      newData.databaseStatus = "error";
                      newData.error = parsed.error;
                      newData.status = "Database error occurred";
                    }
                    break;

                  case "error":
                    newData.error = parsed.data;
                    break;
                }

                return newData;
              });
            } catch (e) {
              console.error("Failed to parse streaming data:", line, e);
            }
          }
        }
      }
    } catch (error) {
      setData((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData({
      scheduleData: {},
      initialValidationStatus: "idle",
      extractionStatus: "idle",
      databaseStatus: "idle",
      status: "",
    });
    setIsGenerating(false);
  }, []);

  return {
    data,
    isGenerating,
    startGeneration,
    reset,
  };
}

// React Query hook for fetching user schedule and classmates
export function useScheduleData(userId: string | null) {
  return useQuery({
    queryKey: ["schedule", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");

      const response = await fetch(`/api/schedules?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }
      return response.json() as Promise<{
        schedule: ScheduleData | null;
        classmates: Record<
          string,
          Array<{
            userId: string;
            userName: string;
            userEmail: string;
            period: number;
            dayType: string;
          }>
        >;
        scheduleId?: number;
      }>;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
