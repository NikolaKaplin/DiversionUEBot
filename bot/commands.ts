import bot from ".."

bot.command("start", async (ctx) => {
  ctx.reply("Добро пожаловать, я мультимодальный бот-нейросеть")
  ctx.router.redirect("/")
});

bot.command("check_last_updates", async (ctx) => {
  
})

