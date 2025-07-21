import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/server/db";
import { schedule, course, enrollment, user } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";

// Block access in production
function checkProductionAccess() {
  if (process.env.VERCEL_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }
  return null;
}

// Schema for the JSON data structure
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

// Generate a random fake user
async function createRandomTestUser() {
  const adjectives = [
    "Cool",
    "Smart",
    "Brave",
    "Quick",
    "Happy",
    "Clever",
    "Swift",
    "Bright",
    "Kind",
    "Bold",
  ];
  const animals = [
    "Tiger",
    "Eagle",
    "Dolphin",
    "Wolf",
    "Fox",
    "Bear",
    "Hawk",
    "Lion",
    "Owl",
    "Shark",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  const username = `${randomAdjective}${randomAnimal}${randomNumber}`;
  const userId = `test-user-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const email = `${username.toLowerCase()}@test.example.com`;

  try {
    const [newUser] = await db
      .insert(user)
      .values({
        id: userId,
        name: username,
        email: email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newUser;
  } catch (error) {
    console.error("Error creating test user:", error);
    throw error;
  }
}

// Helper function to save schedule data to database (same as generate route)
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
        .where(eq(course.teacherName, courseData.teacherName));

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
          teacherName: courseData.teacherName,
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
        if (newCourse.courseCode !== normalizedExisting.courseCode) {
          return false;
        }
      }

      // Check room number compatibility
      if (newCourse.roomNumber && normalizedExisting.roomNumber) {
        if (newCourse.roomNumber !== normalizedExisting.roomNumber) {
          return false;
        }
      }

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
        dayType: "both",
      });
    }

    return newSchedule;
  } catch (error) {
    console.error("Error saving schedule to database:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  // Block access in production
  const productionCheck = checkProductionAccess();
  if (productionCheck) return productionCheck;

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const imageUrl = `data:${image.type};base64,${base64}`;

    // Create a random test user first
    console.log("Creating random test user...");
    const testUser = await createRandomTestUser();
    if (!testUser) {
      throw new Error("Failed to create test user");
    }
    console.log("Created test user:", {
      id: testUser.id,
      name: testUser.name,
      email: testUser.email,
    });

    console.log("Starting image processing...");

    // Step 1: Initial validation
    console.log("Running initial validation...");
    const initialValidation = await generateObject({
      model: openai("gpt-4.1-mini"),
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
              text: "Determine whether this image contains a valid schedule for a student. The image is still acceptable even if it's not cropped exactly to the schedule. Images may contain extraneous information, but as long as the schedule is visible, it's acceptable. The schedule will look like a table with rows and two columns.",
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    });

    console.log("Initial validation result:", initialValidation.object);

    // Stop processing if initial validation fails
    if (!initialValidation.object.isValid) {
      return Response.json(
        {
          initialValidation: initialValidation.object,
          testUser: {
            id: testUser.id,
            name: testUser.name,
            email: testUser.email,
          },
          error: "Image does not contain a valid schedule",
        },
        { status: 400 }
      );
    }

    // Step 2: Data extraction
    console.log("Extracting schedule data...");
    const extractionResult = await generateObject({
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

    console.log("Extraction result:", extractionResult.object);

    let scheduleId = null;
    let databaseError = null;

    // Step 3: Save to database
    try {
      console.log("Saving to database...");
      const savedSchedule = await saveScheduleToDatabase(
        testUser.id,
        extractionResult.object
      );
      scheduleId = savedSchedule.id;
      console.log("Saved to database with ID:", scheduleId);
    } catch (dbError) {
      console.error("Database error:", dbError);
      databaseError =
        dbError instanceof Error ? dbError.message : "Database error";
    }

    return Response.json({
      initialValidation: initialValidation.object,
      extractedData: extractionResult.object,
      scheduleId,
      databaseError,
      testUser: { id: testUser.id, name: testUser.name, email: testUser.email },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
