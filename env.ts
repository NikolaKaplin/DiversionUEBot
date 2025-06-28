// @ts-nocheck
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const env = createEnv({
  server: {
    NODE_ENV: z
      .literal("production")
      .or(z.literal("development"))
      .default("development"),
    TELEGRAM_BOT_TOKEN: z.string(),
    WEBHOOK_DOMAIN: z.string().optional(),
  },
  runtimeEnv: process.env,
});

export default env;
