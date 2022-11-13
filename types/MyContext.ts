import {Context, Scenes} from "telegraf";

export interface myContext extends Context {
    session: sessionContext;
}
export interface sessionContext {
    isVerified?: boolean;
    currencyId?: number;
    offers?: [{
        traderChatId: number;
        value: number;
        price: number;
        walletId: string;
        requisiteId: number;
    }];
    tradeId?: number;
    traderChatId?: number;
    trades?: Trade[];
    requisiteId?: number;
    requisite?: string;
}
export interface mySceneSession extends Scenes.SceneSessionData {}
export interface Trade {
    traderChatId?: number;
    buyerChatId?: number;
    value?: number;
    tradeId?: number;
}