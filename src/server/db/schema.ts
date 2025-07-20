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
	(name) => `schedule-finder_${name}`,
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
	],
);
