import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTableCreator,
  text,
} from "drizzle-orm/sqlite-core";
import * as auth from "./auth-schema";
export * from "./auth-schema";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator(
  (name) => `schedule-finder_${name}`
);

export const post = createTable(
  "post",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text({ length: 256 }),
    createdById: text({ length: 255 })
      .notNull()
      .references(() => auth.user.id),
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ]
);

export const schedule = createTable(
  "schedule",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text({ length: 255 })
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("user_idx").on(t.userId),
    index("created_at_idx").on(t.createdAt),
  ]
);

export const course = createTable(
  "course",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    courseCode: text("course_code", { length: 50 }),
    courseName: text("course_name", { length: 255 }).notNull(),
    teacherName: text("teacher_name", { length: 255 }).notNull(),
    roomNumber: text("room_number", { length: 50 }),
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (t) => [
    index("course_code_idx").on(t.courseCode),
    index("teacher_idx").on(t.teacherName),
    index("room_idx").on(t.roomNumber),
  ]
);

export const enrollment = createTable(
  "enrollment",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    scheduleId: integer("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    period: integer("period").notNull(), // 1, 2, 3, 4, or 5 (advisory)
    dayType: text("day_type", { length: 10 }).notNull(), // "red" or "blue"
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (t) => [
    index("schedule_idx").on(t.scheduleId),
    index("course_idx").on(t.courseId),
    index("period_day_idx").on(t.period, t.dayType),
  ]
);
