import { openai } from "@ai-sdk/openai";
import { streamText, streamObject, generateObject } from "ai";
import { z } from "zod";
import { db } from "@/server/db";
import { schedule, course, enrollment } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { shouldSkipDatabase } from "@/lib/env-utils";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Schema for the JSON data structure (adjust this to your needs)
const PeriodSchema = z.object({
  redDay: z
    .object({
      courseCode: z.string(),
      courseName: z.string(),
      teacherName: z.string(),
      roomNumber: z.string().optional(),
    })
    .nullable(),
  blueDay: z
    .object({
      courseCode: z.string(),
      courseName: z.string(),
      teacherName: z.string(),
      roomNumber: z.string().optional(),
    })
    .nullable(),
});
const DataSchema = z.object({
  firstPeriod: PeriodSchema,
  secondPeriod: PeriodSchema,
  thirdPeriod: PeriodSchema,
  fourthPeriod: PeriodSchema,
  advisory: z.object({
    teacherName: z.string(),
    roomNumber: z.string().optional(),
  }),
});

// Helper function to save schedule data to database
async function saveScheduleToDatabase(
  userId: string,
  scheduleData: z.infer<typeof DataSchema>
) {
  try {
    // Delete existing schedules and enrollments for this user
    const existingSchedules = await db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, userId));
    for (const sched of existingSchedules) {
      await db.delete(enrollment).where(eq(enrollment.scheduleId, sched.id));
      await db.delete(schedule).where(eq(schedule.id, sched.id));
    }
    // Create schedule record
    const scheduleResult = await db
      .insert(schedule)
      .values({
        userId,
      })
      .returning();

    if (!scheduleResult[0]) {
      throw new Error("Failed to create schedule record");
    }
    const newSchedule = scheduleResult[0];

    // Helper to find or create course with smart matching
    async function findOrCreateCourse(courseData: {
      courseCode?: string;
      courseName: string;
      teacherName: string;
      roomNumber?: string;
    }) {
      // Normalize whitespace and special characters for consistent matching
      const normalizedCourseData = {
        ...courseData,
        courseCode:
          courseData.courseCode?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ||
          undefined,
        roomNumber:
          courseData.roomNumber?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ||
          undefined,
      };

      // Search for all courses with the same teacher name first
      const existingCourses = await db
        .select()
        .from(course)
        .where(eq(course.teacherName, courseData.teacherName.toUpperCase()));

      // Check each existing course for compatibility with normalization
      for (const existingCourse of existingCourses) {
        const isMatch = isCoursesMatch(normalizedCourseData, existingCourse);
        if (isMatch) {
          return existingCourse;
        }
      }

      // No match found, create new course
      const courseResult = await db
        .insert(course)
        .values({
          courseCode: courseData.courseCode || null,
          courseName: courseData.courseName,
          teacherName: courseData.teacherName.toUpperCase(),
          roomNumber: courseData.roomNumber || null,
        })
        .returning();

      if (!courseResult[0]) {
        throw new Error("Failed to create course record");
      }
      return courseResult[0];
    }

    // Smart course matching logic
    function isCoursesMatch(
      newCourse: {
        courseCode?: string;
        roomNumber?: string;
        teacherName: string;
      },
      existingCourse: {
        courseCode: string | null;
        roomNumber: string | null;
        teacherName: string;
      }
    ): boolean {
      // Must be same teacher
      if (newCourse.teacherName !== existingCourse.teacherName) {
        return false;
      }

      // Normalize existing course data for comparison
      const normalizedExisting = {
        courseCode:
          existingCourse.courseCode
            ?.replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase() || null,
        roomNumber:
          existingCourse.roomNumber
            ?.replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase() || null,
      };

      // Check course code compatibility
      if (newCourse.courseCode && normalizedExisting.courseCode) {
        // Both have course codes - they must match
        if (newCourse.courseCode !== normalizedExisting.courseCode) {
          return false;
        }
      }

      // Check room number compatibility
      if (newCourse.roomNumber && normalizedExisting.roomNumber) {
        // Both have room numbers - they must match
        if (newCourse.roomNumber !== normalizedExisting.roomNumber) {
          return false;
        }
      }

      // If we get here, either:
      // 1. Course codes match (or one is missing)
      // 2. Room numbers match (or one is missing)
      // 3. At least one field matches and no conflicts

      // Check if at least one field actually matches
      const courseCodeMatches = !!(
        newCourse.courseCode &&
        normalizedExisting.courseCode &&
        newCourse.courseCode === normalizedExisting.courseCode
      );
      const roomNumberMatches = !!(
        newCourse.roomNumber &&
        normalizedExisting.roomNumber &&
        newCourse.roomNumber === normalizedExisting.roomNumber
      );

      return courseCodeMatches || roomNumberMatches;
    }

    // Process each period
    const periods = [
      { period: 1, data: scheduleData.firstPeriod },
      { period: 2, data: scheduleData.secondPeriod },
      { period: 3, data: scheduleData.thirdPeriod },
      { period: 4, data: scheduleData.fourthPeriod },
    ];

    for (const { period: periodNum, data: periodData } of periods) {
      // Handle Red Day
      if (periodData.redDay) {
        const redCourse = await findOrCreateCourse(periodData.redDay);
        if (!redCourse) throw new Error("Failed to create/find red day course");

        await db.insert(enrollment).values({
          scheduleId: newSchedule.id,
          courseId: redCourse.id,
          period: periodNum,
          dayType: "red",
        });
      } else {
        // Handle free period
        const freeCourse = await findOrCreateCourse({
          courseCode: "FREE",
          courseName: "Free Period",
          teacherName: "FREE PERIOD",
        });
        if (!freeCourse)
          throw new Error("Failed to create/find free period course");

        await db.insert(enrollment).values({
          scheduleId: newSchedule.id,
          courseId: freeCourse.id,
          period: periodNum,
          dayType: "red",
        });
      }

      // Handle Blue Day
      if (periodData.blueDay) {
        const blueCourse = await findOrCreateCourse(periodData.blueDay);
        if (!blueCourse)
          throw new Error("Failed to create/find blue day course");

        await db.insert(enrollment).values({
          scheduleId: newSchedule.id,
          courseId: blueCourse.id,
          period: periodNum,
          dayType: "blue",
        });
      } else {
        // Handle free period
        const freeCourse = await findOrCreateCourse({
          courseCode: "FREE",
          courseName: "Free Period",
          teacherName: "FREE PERIOD",
        });
        if (!freeCourse)
          throw new Error("Failed to create/find free period course");

        await db.insert(enrollment).values({
          scheduleId: newSchedule.id,
          courseId: freeCourse.id,
          period: periodNum,
          dayType: "blue",
        });
      }
    }

    // Handle Advisory (period 5)
    if (scheduleData.advisory) {
      const advisoryCourse = await findOrCreateCourse({
        courseCode: "ADV",
        courseName: "Advisory",
        teacherName: scheduleData.advisory.teacherName,
        roomNumber: scheduleData.advisory.roomNumber,
      });
      if (!advisoryCourse)
        throw new Error("Failed to create/find advisory course");

      await db.insert(enrollment).values({
        scheduleId: newSchedule.id,
        courseId: advisoryCourse.id,
        period: 5,
        dayType: "both", // Advisory is the same for both days
      });
    }

    return newSchedule;
  } catch (error) {
    console.error("Error saving schedule to database:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const userId = formData.get("userId") as string; // We'll need to pass this from the frontend

    if (!image) {
      return new Response("No image provided", { status: 400 });
    }

    if (!userId) {
      return new Response("User not authenticated", { status: 401 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const imageUrl = `data:${image.type};base64,${base64}`;

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Initial validation
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "initial-validation", data: "started" }) +
                "\n"
            )
          );

          const initialValidation = await generateObject({
            model: openai("gpt-4.1"),
            schema: z.object({
              isValid: z.boolean(),
              confidence: z.number(),
              issues: z.array(z.string()),
            }),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Determine whether this image contains a valid schedule for a student. The image is still acceptable even if it's not cropped exactly to the schedule. Images may contain extraneous information, but as long as the schedule is visible, it's acceptable. The schedule should look like a table with rows and two columns. If it is not present, mark the image as invalid. Otherwise, mark the image as valid.",
                  },
                  { type: "image", image: imageUrl },
                ],
              },
            ],
          });

          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "initial-validation",
                data: "complete",
                result: initialValidation.object,
              }) + "\n"
            )
          );

          // Stop processing if initial validation fails
          if (!initialValidation.object.isValid) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: "error",
                  data: "Image does not contain a valid schedule",
                }) + "\n"
              )
            );
            controller.close();
            return;
          }

          // Step 2: Data extraction
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "data-extraction", data: "started" }) +
                "\n"
            )
          );

          const jsonResult = streamObject({
            model: openai("gpt-4.1-mini"),
            schema: DataSchema,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "This image contains a schedule for a student. Extract the schedule into a JSON object. If a period has no class scheduled (free period), set that day to null. For example, if red day period 1 has no class, set redDay to null for that period.",
                  },
                  { type: "image", image: imageUrl },
                ],
              },
            ],
          });

          for await (const partialObject of jsonResult.partialObjectStream) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ type: "json_partial", data: partialObject }) +
                  "\n"
              )
            );
          }

          const finalJsonData = await jsonResult.object;

          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "data-extraction",
                data: "complete",
                result: finalJsonData,
              }) + "\n"
            )
          );

          // Step 3: Save to database (skip in preview mode)
          if (shouldSkipDatabase()) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ type: "database", data: "skipped" }) + "\n"
              )
            );
          } else {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ type: "database", data: "saving" }) + "\n"
              )
            );

            try {
              const savedSchedule = await saveScheduleToDatabase(
                userId,
                finalJsonData
              );

              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "database",
                    data: "complete",
                    scheduleId: savedSchedule.id,
                  }) + "\n"
                )
              );
            } catch (dbError) {
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "database",
                    data: "error",
                    error:
                      dbError instanceof Error
                        ? dbError.message
                        : "Database error",
                  }) + "\n"
                )
              );
            }
          }

          controller.close();
        } catch (error) {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "error",
                data: error instanceof Error ? error.message : "Unknown error",
              }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return new Response("Error processing request", { status: 500 });
  }
}
