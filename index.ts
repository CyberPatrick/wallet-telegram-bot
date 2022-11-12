import {Scenes, Telegraf} from "telegraf";
import LocalSession from "telegraf-session-local";
// @ts-ignore
import config from "config";

import API from "./classes/API";
import ScenesList from "./classes/ScenesList";

import startBot from "./utils/startBot";

import {myContext} from "./types/MyContext";

const bot = new Telegraf<myContext>(config.get("Bot.token"));
const stage = new Scenes.Stage([ScenesList.getVerificationScene()])

const localSession = new LocalSession({
    database: "sessions.json",
    storage: LocalSession.storageFileAsync
})

// @ts-ignore
localSession.DB.then(DB => {
    console.log('Current LocalSession DB:', DB.value())
})

bot.use(localSession.middleware());

bot.start(async (ctx) => {

})

// @ts-ignore
startBot(bot).then(() => {
    console.log("Bot started");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));