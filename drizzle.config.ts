import type { Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_SECRET,
  },
  tablesFilter: ["schedule-finder_*"],
} satisfies Config;
