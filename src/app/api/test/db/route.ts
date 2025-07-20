import { db } from "@/server/db";
import { schedule, course, enrollment, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Block access in production
function checkProductionAccess() {
  if (process.env.VERCEL_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }
  return null;
}

export async function GET() {
  // Block access in production
  const productionCheck = checkProductionAccess();
  if (productionCheck) return productionCheck;
  try {
    // Fetch all users
    const users = await db.select().from(user).orderBy(user.createdAt);

    // Fetch all courses
    const courses = await db.select().from(course).orderBy(course.createdAt);

    // Fetch all schedules with user info
    const schedules = await db
      .select({
        id: schedule.id,
        userId: schedule.userId,
        createdAt: schedule.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(schedule)
      .innerJoin(user, eq(user.id, schedule.userId))
      .orderBy(schedule.createdAt);

    // Fetch all enrollments with course details
    const enrollments = await db
      .select({
        id: enrollment.id,
        scheduleId: enrollment.scheduleId,
        period: enrollment.period,
        dayType: enrollment.dayType,
        course: {
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          teacherName: course.teacherName,
          roomNumber: course.roomNumber,
          createdAt: course.createdAt,
        },
      })
      .from(enrollment)
      .innerJoin(course, eq(course.id, enrollment.courseId))
      .orderBy(enrollment.scheduleId, enrollment.period, enrollment.dayType);

    return Response.json({
      users,
      courses,
      schedules,
      enrollments,
    });
  } catch (error) {
    console.error("Error fetching database data:", error);
    return Response.json(
      { error: "Failed to fetch database data" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Block access in production
  const productionCheck = checkProductionAccess();
  if (productionCheck) return productionCheck;

  try {
    // Delete in correct order to avoid foreign key constraints
    await db.delete(enrollment);
    await db.delete(schedule);
    await db.delete(course);
    await db.delete(user);

    return Response.json({ message: "Database cleared successfully" });
  } catch (error) {
    console.error("Error clearing database:", error);
    return Response.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}
