import { db } from "@/server/db";
import { user, schedule } from "@/server/db/schema";
import { eq, ne, exists, and } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const excludeUserId = searchParams.get("excludeUserId");

  // Only return users who have a schedule
  const usersWithSchedule = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(
      and(
        exists(db.select().from(schedule).where(eq(schedule.userId, user.id))),
        excludeUserId ? ne(user.id, excludeUserId) : undefined
      )
    )
    .orderBy(user.name);

  return Response.json({ users: usersWithSchedule });
}
