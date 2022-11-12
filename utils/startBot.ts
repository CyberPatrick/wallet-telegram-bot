// @ts-ignore
import config from "config";
import {Telegraf} from "telegraf";
import fs from "fs";
import path from "path";

export default async function (bot: Telegraf) {
  if (config.get("isDev")) {
    await bot.launch();
  } else {
    await bot.telegram.setWebhook(`https://${config.get("Server.IP")}:${config.get("Server.PORT")}/${config.get("Bot.token")}`, {
      certificate: {
        source: fs.createReadStream(path.resolve(__dirname, '../SSL/YOURPUBLIC.pem'))
      },
    });
    await bot.launch({
      webhook: {
        certificate: {
          source: fs.readFileSync(path.resolve(__dirname, '../SSL/YOURPUBLIC.pem'))
        },
        domain: `https://${config.get("Server.IP")}/`,
        port: config.get("Server.PORT"),
        tlsOptions: {
          key: fs.readFileSync(path.resolve(__dirname, '../SSL/YOURPRIVATE.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, '../SSL/YOURPUBLIC.pem'))
        }
      }
    })
  }
}