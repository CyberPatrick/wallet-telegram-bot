import {Markup, Scenes} from "telegraf";
import API from "./API";
import {myContext, Trade} from "../types/MyContext";
import {Offer} from "../types/response";
import downloadScreenshot from "../utils/downloadScreenshot";
// @ts-ignore
import config from "config";
import uploadScreenshot from "../utils/uploadScreenshot";
import {fromReadableStream} from "telegraf/typings/input";
import dayjs from "dayjs";
// @ts-ignore
import customParseFormat from "days/plugin/customParseFormat";
import "dayjs/locale/ru";

dayjs.extend(customParseFormat)

export default class ScenesList {
    constructor() {}

    static getVerificationScene() {
        return new Scenes.WizardScene (
            "verification",
            async (ctx) => {
                await ctx.reply("Вам нужно пройти верификацию. Введите свой логин");
                return ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                if (ctx.message?.text) {
                    // @ts-ignore
                    let response = await API.createVerificationCode(ctx.message.text, ctx.message.from.id);
                    await ctx.reply(response.message);
                    if (response.statusCode === 200) {
                        return ctx.wizard.next();
                    } else {
                        return ctx.wizard.back();
                    }
                } else {
                    return await ctx.reply("Введите логин");
                }
            },
            async (ctx) => {
                await ctx.reply("Введите код", Markup.keyboard(["Отмена"]).oneTime().resize());
                return ctx.wizard.next()
            },
            async (ctx) => {
                // @ts-ignore
                if (ctx.message?.text === "Отмена") {
                    let response = await API.deleteCode(ctx.message.from.id);
                    await ctx.reply(response.message); // надо ли
                    return ctx.wizard.selectStep(0);
                } else {
                    // @ts-ignore
                    let response = await API.checkCode(ctx.message.text, ctx.message.from.id);
                    await ctx.reply(response.message)
                    if (response.answer) {
                        await ctx.scene.enter("main");
                    } else {
                        await API.deleteCode(ctx.message.from.id);
                        return ctx.wizard.selectStep(0);
                    }
                }
            }
        )
    }

    static getMainScene() {
        let mainScene = new Scenes.BaseScene<Scenes.SceneContext>("main");
        mainScene.use(async (ctx, next) => {
            // @ts-ignore
            if (!ctx.session?.isVerified) {
                return ctx.scene.enter("verification")
            } else {
                await next();
            }
        })
        mainScene.enter(async (ctx) => {
            // @ts-ignore
            delete ctx.session.currencyId;
            // @ts-ignore
            delete ctx.session.offers;
            // @ts-ignore
            delete ctx.session.tradeId;
            // @ts-ignore
            delete ctx.session.traderChatId;
            // @ts-ignore
            delete ctx.session.trades;
            // @ts-ignore
            delete ctx.session.requisiteId;
            // @ts-ignore
            delete ctx.session.requisite;
            await ctx.reply("Выберите одно из действий", Markup.keyboard([
                [
                    "Покупка",
                    "Баланс",
                    "Продажа"
                ],
                [
                    "Инструкция",
                    "Тех.поддержка"
                ],
                [
                    "Сменить язык"
                ],
                [
                    "Реквизиты"
                ]
            ]).resize())
        })
        mainScene.hears("Инструкция", async (ctx) => {
           await ctx.reply("Инструкция...")
        });
        mainScene.hears("Тех.поддержка", async (ctx) => {
            await ctx.reply("Тех.поддержка...")
        })
        mainScene.hears("Баланс", async (ctx) => {
            let response = await API.getBalance(ctx.message.from.id);
            if (response.statusCode === 200) {
                await ctx.reply(
                    `Ваш баланс: ${response.balance}\nНа продаже: ${response.onsale}\nВ обработке: ${response.onwork}`
                );
            } else {
                await ctx.reply(response.message);
            }
        })
        mainScene.hears("Покупка", async (ctx) => {
            ctx.reply("Меню покупки", Markup.keyboard([
                ["Мои покупки"], ["Купить"], ["Обратно"]
            ]).resize())
        })
        mainScene.hears("Реквизиты", async (ctx) => {
            await ctx.scene.enter("requisites");
        })
        mainScene.hears("Обратно", async (ctx) => {
            await ctx.scene.enter("main");
        })
        mainScene.hears("Мои покупки", async (ctx) => {
            let response = await API.getPurchases(ctx.message.from.id);
            if (response.statusCode === 404 || !response.trades.length) {
                return await ctx.reply("Нет покупок");
            } else {
                for (let trade of response.trades) {
                    let text = `ID: ${trade.id}\nВалюта: ${trade.currency}` +
                    `\nОрганизация: ${trade.organisation}\nКоличество: ${trade.value}\nЦена: ${trade.price}` +
                    `\nДата создания: ${trade.creationDate}`
                    if (trade.transfer) {
                        await ctx.reply(text);
                    } else {
                        await ctx.reply(text, Markup.inlineKeyboard([
                            Markup.button.callback("Отправил токен", `token.${trade.id}.${trade.traderChatId}`),
                            Markup.button.callback("Отмена", `cancel.${trade.id}.${trade.traderChatId}`)
                        ]))
                    }
                }
            }
        })
        mainScene.action(/\w+?\.\d+\.\d+/, async (ctx) => {
            let [action, id, traderChatId] = ctx.callbackQuery.data.split(".");
            if (action === "token") {
                // @ts-ignore
                ctx.session.tradeId = id;
                // @ts-ignore
                ctx.session.traderChatId = traderChatId;
                await ctx.scene.enter("screenshot");
            } else if (action === "cancel") {
                let response = await API.cancelTrade(ctx.callbackQuery.from.id, Number(traderChatId));
                await ctx.reply(response.message);
            } else {
                await ctx.answerCbQuery("Ошибка");
            }
        })
        mainScene.hears("Купить", async (ctx) => {
            let response = await API.getRequisiteTypes();
            if (response.statusCode !== 200 || !response.requisiteTypes.length) {
                await ctx.reply(response.message);
                return await ctx.scene.enter("main");
            } else {
                let requisiteTypes = response.requisiteTypes;
                for (let requisiteType of requisiteTypes) {
                    await ctx.reply(`Валюта: ${requisiteType.currency}\nОрганизация: ${requisiteType.org}`,
                        Markup.inlineKeyboard([
                            Markup.button.callback("Выбрать", requisiteType.id.toString())
                        ]));
                }
            }
        })
        mainScene.action(/^\d+/, async (ctx) => {
            // @ts-ignore
            ctx.session.currencyId = ctx.callbackQuery.data;
            await ctx.answerCbQuery();
            return await ctx.scene.enter("buy");
        })
        return mainScene;
    }

    static getScreenShotScene() {
        return new Scenes.WizardScene(
            "screenshot",
            async (ctx) => {
                await ctx.reply("Пришлите скриншот", Markup.keyboard(["Отмена"]));
                ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                if (ctx.message?.text === "Отмена") {
                    await ctx.scene.enter("main");
                } else { // @ts-ignore
                    if (ctx.message?.photo) {
                        // @ts-ignore
                        let photo = ctx.message.photo[0];
                        let file = await ctx.telegram.getFile(photo.file_id);
                        let downloadPath = `https://api.telegram.org/file/bot${config.get("Bot.token")}/${file.file_path}`;
                        // @ts-ignore
                        await downloadScreenshot(ctx.message.from.id, ctx.session.tradeId, downloadPath);
                        // @ts-ignore
                        let response = await API.setTransfer(ctx.message.from.id, ctx.message.session.tradeId);
                        // @ts-ignore
                        await ctx.telegram.sendPhoto(ctx.session.traderChatId, photo.file_id,
                            { caption: "Подтверждение" });
                        await ctx.reply(response.message);
                        await ctx.scene.enter("main");
                    }
                }
            }
        )
    }

    static getBuyScene() {
        const buyScene = new Scenes.WizardScene(
            "buy",
            async (ctx) => {
                await ctx.reply("Введите число", Markup.keyboard(["Отмена"]).resize());
                return ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                let amount = Number(ctx.message?.text);
                if (isNaN(amount)) {
                    // @ts-ignore
                    if (ctx.message?.text === "Отмена") {
                        return await ctx.scene.enter("main");
                    }
                    return ctx.wizard.back();
                } else {
                    // @ts-ignore
                    ctx.sessions.offers = [];
                    // @ts-ignore
                    await getOffersList(ctx, amount);
                }
            }
        )
        buyScene.use(async (ctx, next) => {
            // @ts-ignore
            if (!ctx.session?.isVerified) {
                return ctx.scene.enter("verification")
            } else {
                await next();
            }
        })
        buyScene.action(/^\d+/, async (ctx) => {
            let traderChatId = Number(ctx.callbackQuery.data);
            if (isNaN(traderChatId)) {
                return await ctx.answerCbQuery("Произошла ошибка");
            }
            // @ts-ignore
            let response = await API.buy(ctx.callbackQuery.from.id, ctx.session.currencyId);
            if (response.statusCode === 200) {
                // @ts-ignore
                let trade = getTradeByTraderChatId(ctx, traderChatId);
                // @ts-ignore
                response = await API.createTrade(trade.traderChatId, ctx.session.currencyId,
                    trade.price, ctx.callbackQuery.from.id, trade.requisiteId);
                await ctx.reply(response.message);
                await ctx.scene.enter("main")
            } else {
                await ctx.answerCbQuery("Не получилось купить");
            }
        })
        // Начинается с "{" - json
        buyScene.action(/^[{]/, async (ctx) => {
            let data = JSON.parse(ctx.callbackQuery.data);
            // @ts-ignore
            await getOffersList(ctx, data.amount, data.start, data.end);
        })
        return buyScene;
    }

    static getSellScene() {
        let sellScene = new Scenes.BaseScene<Scenes.SceneContext>("sell");
        sellScene.use(async (ctx, next) => {
            // @ts-ignore
            if (!ctx.session?.isVerified) {
                return ctx.scene.enter("verification")
            } else {
                await next();
            }
        })
        sellScene.enter(async (ctx) => {
            await ctx.reply("Выберите действие", Markup.keyboard([
                "Отправить на продажу", "В процессе", "Обратно"
            ]).resize())
        })
        sellScene.hears("Обратно", async (ctx) => {
            await ctx.scene.enter("main");
        })
        sellScene.hears("В процессе", async (ctx) => {
            let response = await API.getTrades(ctx.message.from.id);
            // @ts-ignore
            ctx.session.trades = [];
            for (let trade of response.trades) {
                if (trade.transfer) {
                    let rStream = await uploadScreenshot(trade.buyerChatId, trade.id);
                    await ctx.replyWithPhoto(fromReadableStream(rStream), {
                        caption: `ID: ${trade.id}\nКоличество: ${trade.value}\nЦена: ${trade.price}` +
                            `\nДата создания: ${trade.transferdateCreation}`,
                        // @ts-ignore
                        reply_markup: Markup.inlineKeyboard([
                            Markup.button.callback("Подтвердить", trade.id.toString())
                        ])
                    });
                    // @ts-ignore
                    ctx.session.trades.append({
                        traderChatId: trade.traderChatId,
                        buyerChatId: trade.buyerChatId,
                        value: trade.value,
                        tradeId: trade.id
                    })
                } else {
                    let dateCreation = dayjs(trade.transferdateCreation, "DD.MM.YYYY HH:mm");
                    if (!trade.transfer && dateCreation > dayjs().add(30, "m")) {
                        await ctx.reply(`ID: ${trade.id}\nКоличество: ${trade.value}\nЦена: ${trade.price}` +
                            `\nДата создания: ${trade.transferdateCreation}`, Markup.inlineKeyboard([
                            Markup.button.callback("Отмена", "d" + trade.id.toString())
                        ]))
                    }
                }
            }
        })
        sellScene.action(/^\d+/, async (ctx) => {
            let tradeId = Number(ctx.callbackQuery.data);
            let response = await API.confirmTrade(ctx.callbackQuery.from.id, tradeId);
            await ctx.reply(response.message);
            if (response.statusCode === 200) {
                // @ts-ignore
                let trade = getTradeByTradeId(ctx, tradeId);
                response = await API.markTradeDone(trade.buyerChatId, trade.traderChatId, trade.value);
                await ctx.reply(response.message);
            }
        })
        sellScene.action(/d\d+/, async (ctx) => {
            let tradeId = parseInt(ctx.callbackQuery.data);
            let response = await API.cancelTrade(ctx.from.id, tradeId);
            await ctx.reply(response.message);
        })
        sellScene.hears("Отправить на продажу", async (ctx) => {
            await ctx.scene.enter("sendToSale");
        })

        return sellScene;
    }

    static getSendToSaleScene() {
        return new Scenes.WizardScene(
            "sendToSale",
            async (ctx) => {
                await ctx.reply("Введите число", Markup.keyboard(["Отмена"]).resize());
                ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                let amount = Number(ctx.message?.text);
                if (isNaN(amount)) {
                    // @ts-ignore
                    if (ctx.message?.text === "Отмена") {
                        return await ctx.scene.enter("main");
                    }
                    return ctx.wizard.back();
                } else {
                    let response = await API.sendToSale(ctx.message.from.id, amount);
                    await ctx.reply(response.message);
                    await ctx.scene.enter("main");
                }
            }
        )
    }

    static getRequisitesScene() {
        let requisiteScene = new Scenes.BaseScene<Scenes.SceneContext>("requisites");
        requisiteScene.enter(async (ctx) => {
            await ctx.reply("Выберите действие", Markup.keyboard([
                "Мои реквизиты", "Добавить", "Обратно"
            ]).resize())
        })
        requisiteScene.hears("Обратно", async (ctx) => {
            await ctx.scene.enter("main");
        })
        requisiteScene.hears("Мои реквизиты", async (ctx) => {
            let response = await API.getRequisites(ctx.message.from.id);
            for (let requisite of response.requisites) {
                await ctx.reply(`ID: ${requisite.id}\nОрганизация: ${requisite.organisation}\n` +
                    `Валюта: ${requisite.currency}\nЦена: ${requisite.price}\nРеквизит: ${requisite.requisite}`,
                    Markup.inlineKeyboard([
                        Markup.button.callback("Изменить", requisite.id.toString()),
                        Markup.button.callback("Удалить", "d" + requisite.id)
                    ])
                );
            }
        })
        requisiteScene.action(/d\d+/, async (ctx) => {
            let requisiteId = parseInt(ctx.callbackQuery.data);
            let response = await API.deleteRequisite(ctx.callbackQuery.from.id, requisiteId);
            await ctx.reply(response.message);
        })
        requisiteScene.action(/^\d+/, async (ctx) => {
            // @ts-ignore
            ctx.session.requisiteId = Number(ctx.callbackQuery.data);
            await ctx.scene.enter("changeRequisite");
        })
        requisiteScene.hears("Добавить", async (ctx) => {
            let response = await API.getRequisiteTypes();
            if (response.statusCode !== 200) {
                return ctx.reply(response.message);
            } else {
                let requisiteTypes = response.requisiteTypes;
                for (let requisiteType of requisiteTypes) {
                    await ctx.reply(`Валюта: ${requisiteType.currency}\nОрганизация: ${requisiteType.org}`,
                        Markup.inlineKeyboard([
                            Markup.button.callback("Выбрать", requisiteType.id.toString())
                        ]));
                }
            }
        })
        requisiteScene.action(/^\d+/, async (ctx) => {
            // @ts-ignore
            ctx.session.requisiteId = Number(ctx.callbackQuery.data);
            await ctx.scene.enter("addRequisite");
        })
        return requisiteScene
    }

    static getAddRequisiteScene() {
        return new Scenes.WizardScene(
            "addRequisite",
            async (ctx) => {
                await ctx.reply("Введите реквизит");
                ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                ctx.session.requisite = ctx.message?.text;
                await ctx.reply("Введите цену");
                ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                let price = Number(ctx.message?.text);
                if (isNaN(price)) {
                    // @ts-ignore
                    if (ctx.message?.text === "Отмена") {
                        return await ctx.scene.enter("main");
                    }
                    return ctx.wizard.back();
                } else {
                    // @ts-ignore
                    let response = await API.createRequisite(ctx.session.requisiteId, ctx.message.from.id,
                        // @ts-ignore
                        price, ctx.session.requisite);
                    await ctx.reply(response.message);
                    await ctx.scene.enter("main");
                }
            }
        )
    }

    static getChangeRequisiteScene() {
        return new Scenes.WizardScene(
            "changeRequisite",
            async (ctx) => {
                await ctx.reply("Введите реквизит", Markup.keyboard(["Отмена"]).resize());
                ctx.wizard.next()
            },
            async (ctx) => {
                await ctx.reply("Введите число");
                // @ts-ignore
                ctx.session.requisite = ctx.message?.text;
                ctx.wizard.next();
            },
            async (ctx) => {
                // @ts-ignore
                let price = Number(ctx.message?.text);
                if (isNaN(price)) {
                    // @ts-ignore
                    if (ctx.message?.text === "Отмена") {
                        return await ctx.scene.enter("main");
                    }
                    return ctx.wizard.back();
                } else {
                    // @ts-ignore
                    let response = await API.updateRequisite(ctx.message.from.id, ctx.session.requisiteId,
                        // @ts-ignore
                        price, ctx.session.requisite
                    );
                    await ctx.reply(response.message);
                    await ctx.scene.enter("main");
                }
            }
        )
    }
}

function getTradeByTraderChatId(ctx: myContext, traderChatId: number): Offer {
    for (let trade of ctx.session.offers) {
        if (trade.traderChatId === traderChatId) {
            return trade;
        }
    }
}

function getTradeByTradeId(ctx: myContext, tradeId: number): Trade {
    for (let trade of ctx.session.trades) {
        if (trade.tradeId === tradeId) {
            return trade;
        }
    }
}

async function getOffersList(ctx: myContext, amount: number, start: number = 0, end: number = 10) {
    let response = await API.getOffer(ctx.session.currencyId, ctx.message.from.id, amount, start, end);
    if (response.statusCode !== 200 || !response.trades.length) {
        await ctx.reply(response.message);
        // @ts-ignore
        return ctx.wizard.back();
    } else {
        // @ts-ignore
        // ctx.session.offers = [];
        for (let i = 0; i < response.trades.length; i++) {
            let offer = response.trades[i];
            let buttons = [
                Markup.button.callback("Купить", offer.traderChatId.toString())
            ]
            if (i + 1 == response.trades.length) {
                buttons.push(Markup.button.callback("Ещё", JSON.stringify({
                    // @ts-ignore
                    start: start + 10, end: end + 10, amount,
                })))
            }
            await ctx.reply(`Цена: ${offer.price}`, Markup.inlineKeyboard(buttons))
            // @ts-ignore
            ctx.session.offers.push(offer)
        }
    }
}