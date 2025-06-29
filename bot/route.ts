import { message } from "telegraf/filters";
import bot, { CustomContext, dv } from "..";
import { RouteConfig } from "../util/BotRouting";

const route = new RouteConfig<CustomContext>({
  async greeting(ctx) {
    const router = ctx.router.validate(route);
    if (!router) return;
    const lastMessageId: number | undefined = (ctx as any)?.callbackQuery?.id;
    console.log("lastMessageId: "), lastMessageId;
    if (lastMessageId) {
      ctx.reply("test");
    } else {
      ctx.reply("test");
    }
  },
});

export default route;

bot.on(message("text"), async (ctx) => { });
