import {Scenes, Telegraf} from "telegraf";
import LocalSession from "telegraf-session-local";
// @ts-ignore
import config from "config";

import API from "./classes/API";
import ScenesList from "./classes/ScenesList";

import startBot from "./utils/startBot";

import {myContext} from "./types/MyContext";

const bot = new Telegraf<myContext>(config.get("Bot.token"));
// @ts-ignore
const stage = new Scenes.Stage([
// @ts-ignore
    ScenesList.getVerificationScene(), ScenesList.getMainScene(),
// @ts-ignore
    ScenesList.getScreenShotScene(), ScenesList.getBuyScene(),
// @ts-ignore
    ScenesList.getSellScene(), ScenesList.getSendToSaleScene(),
// @ts-ignore
    ScenesList.getRequisitesScene(), ScenesList.getAddRequisiteScene(),
// @ts-ignore
    ScenesList.getChangeRequisiteScene()
])

const localSession = new LocalSession({
    database: "sessions.json",
    storage: LocalSession.storageFileAsync
})

// @ts-ignore
localSession.DB.then(DB => {
    console.log('Current LocalSession DB:', DB.value())
})

bot.use(localSession.middleware());
// @ts-ignore
bot.use(stage.middleware());

bot.start(async (ctx) => {
    // let response = await API.checkAccount(ctx.message.from.id);
    let response = true;

    if (response) {
        // @ts-ignore
        await ctx.scene.enter("main")
    } else {
        // @ts-ignore
        await ctx.scene.enter("verification");
    }
})

// @ts-ignore
startBot(bot).then(() => {
    console.log("Bot started");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));