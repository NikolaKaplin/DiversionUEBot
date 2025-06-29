import bot, { CustomContext } from "..";
import { message } from "telegraf/filters";
import { RouteConfig } from "../util/BotRouting";

const route = new RouteConfig<CustomContext>({
  greeting(ctx, next?) {
    const router = ctx.router.validate(route);
    if (!router) return next?.();
    ctx.reply("Не найдено", {
      reply_markup: {
        inline_keyboard: [[route.buttons.home]],
      },
    });
  },
});
export default route;

bot.on(message(), route.greeting);
