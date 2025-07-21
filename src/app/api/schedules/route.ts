import { db } from "@/server/db";
import { schedule, course, enrollment, user } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { shouldSkipDatabase } from "@/lib/env-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    // In preview mode, return empty data since we don't save to database
    if (shouldSkipDatabase()) {
      return Response.json({
        schedule: null,
        classmates: {},
      });
    }

    // Get user's schedule
    const userSchedules = await db
      .select({
        scheduleId: schedule.id,
        scheduleCreatedAt: schedule.createdAt,
        period: enrollment.period,
        dayType: enrollment.dayType,
        courseCode: course.courseCode,
        courseName: course.courseName,
        teacherName: course.teacherName,
        roomNumber: course.roomNumber,
      })
      .from(schedule)
      .innerJoin(enrollment, eq(enrollment.scheduleId, schedule.id))
      .innerJoin(course, eq(course.id, enrollment.courseId))
      .where(eq(schedule.userId, userId))
      .orderBy(schedule.createdAt);

    if (userSchedules.length === 0) {
      return Response.json({
        schedule: null,
        classmates: {},
      });
    }

    // Initialize periods with null values for free periods
    const scheduleData = {
      firstPeriod: { redDay: null as any, blueDay: null as any },
      secondPeriod: { redDay: null as any, blueDay: null as any },
      thirdPeriod: { redDay: null as any, blueDay: null as any },
      fourthPeriod: { redDay: null as any, blueDay: null as any },
      advisory: null as any,
    };

    // Group schedule data by period and day type
    for (const item of userSchedules) {
      // Check if this is a free period
      const isFreeMode =
        item.courseCode === "FREE" && item.teacherName === "FREE PERIOD";

      if (item.period === 5) {
        // Advisory - only set if not free period
        if (!isFreeMode) {
          scheduleData.advisory = {
            teacherName: item.teacherName,
            roomNumber: item.roomNumber || undefined,
          };
        }
      } else {
        const periodKey = `${
          ["first", "second", "third", "fourth"][item.period - 1]
        }Period` as keyof typeof scheduleData;
        const dayKey = item.dayType === "red" ? "redDay" : "blueDay";

        if (periodKey !== "advisory") {
          const period = scheduleData[periodKey] as any;
          if (!isFreeMode) {
            // Regular course
            period[dayKey] = {
              courseCode: item.courseCode || "",
              courseName: item.courseName,
              teacherName: item.teacherName,
              roomNumber: item.roomNumber || undefined,
            };
          }
          // If it's a free period, leave it as null (already initialized)
        }
      }
    }

    // Find classmates for each course using smart matching
    const classmates: Record<
      string,
      Array<{
        userId: string;
        userName: string;
        userEmail: string;
        period: number;
        dayType: string;
      }>
    > = {};

    // For each unique course in user's schedule, find other students enrolled
    for (const scheduleItem of userSchedules) {
      // Create a unique key for this specific course enrollment
      const courseKey = `${scheduleItem.courseCode || "NO_CODE"}-${
        scheduleItem.teacherName
      }-${scheduleItem.period}-${scheduleItem.dayType}`;

      if (!classmates[courseKey]) {
        // Build search conditions for finding matching courses
        const searchConditions = [];

        // If courseCode exists, look for courses with that code
        if (scheduleItem.courseCode) {
          searchConditions.push(eq(course.courseCode, scheduleItem.courseCode));
        }

        // If roomNumber exists, look for courses with that room
        if (scheduleItem.roomNumber) {
          searchConditions.push(eq(course.roomNumber, scheduleItem.roomNumber));
        }

        // If no specific identifiers, fall back to teacher + course name match
        if (searchConditions.length === 0) {
          searchConditions.push(
            and(
              eq(course.teacherName, scheduleItem.teacherName),
              eq(course.courseName, scheduleItem.courseName)
            )
          );
        }

        // Find all students in matching courses for this period/day
        const classmatesInCourse = await db
          .select({
            userId: schedule.userId,
            userName: user.name,
            userEmail: user.email,
            period: enrollment.period,
            dayType: enrollment.dayType,
            courseCode: course.courseCode,
            roomNumber: course.roomNumber,
            teacherName: course.teacherName,
          })
          .from(enrollment)
          .innerJoin(course, eq(course.id, enrollment.courseId))
          .innerJoin(schedule, eq(schedule.id, enrollment.scheduleId))
          .innerJoin(user, eq(user.id, schedule.userId))
          .where(
            and(
              eq(course.teacherName, scheduleItem.teacherName),
              eq(enrollment.period, scheduleItem.period),
              eq(enrollment.dayType, scheduleItem.dayType),
              searchConditions.length > 0 ? or(...searchConditions) : undefined
            )
          );

        // Filter to only include courses that actually match using smart matching logic
        const validClassmates = classmatesInCourse.filter((classmate) => {
          // Skip the current user
          if (classmate.userId === userId) return false;

          // Apply the same smart matching logic as in course creation
          return isCoursesMatch(
            {
              courseCode: scheduleItem.courseCode,
              roomNumber: scheduleItem.roomNumber,
              teacherName: scheduleItem.teacherName,
            },
            {
              courseCode: classmate.courseCode,
              roomNumber: classmate.roomNumber,
              teacherName: classmate.teacherName,
            }
          );
        });

        classmates[courseKey] = validClassmates.map((c) => ({
          userId: c.userId,
          userName: c.userName,
          userEmail: c.userEmail,
          period: c.period,
          dayType: c.dayType,
        }));
      }
    }

    return Response.json({
      schedule: scheduleData,
      classmates,
      scheduleId: userSchedules[0]?.scheduleId,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return Response.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// Smart course matching logic (same as in generate route)
function isCoursesMatch(
  newCourse: {
    courseCode?: string | null;
    roomNumber?: string | null;
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

  // Check course code compatibility
  if (newCourse.courseCode && existingCourse.courseCode) {
    // Both have course codes - they must match
    if (newCourse.courseCode !== existingCourse.courseCode) {
      return false;
    }
  }

  // Check room number compatibility
  if (newCourse.roomNumber && existingCourse.roomNumber) {
    // Both have room numbers - they must match
    if (newCourse.roomNumber !== existingCourse.roomNumber) {
      return false;
    }
  }

  // Check if at least one field actually matches
  const courseCodeMatches = !!(
    newCourse.courseCode &&
    existingCourse.courseCode &&
    newCourse.courseCode === existingCourse.courseCode
  );
  const roomNumberMatches = !!(
    newCourse.roomNumber &&
    existingCourse.roomNumber &&
    newCourse.roomNumber === existingCourse.roomNumber
  );

  return courseCodeMatches || roomNumberMatches;
}
