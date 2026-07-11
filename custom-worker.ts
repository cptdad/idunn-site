// @ts-ignore genereras vid build
import { default as handler } from "./.open-next/worker.js";
import { sendReminders } from "./lib/reminders";

export default {
  fetch: handler.fetch,
  async scheduled(_event: any, env: any, ctx: any) {
    ctx.waitUntil(sendReminders(env));
  },
};
