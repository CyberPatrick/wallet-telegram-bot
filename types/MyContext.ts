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
}
export interface mySceneSession extends Scenes.SceneSessionData {}