//@ts-ignore
import config from "config";
import fetch from "node-fetch";
import {
    balanceResponse,
    defaultResponse,
    defaultWithAnswer,
    offerResponse, purchaseResponse, requisitesResponse,
    requisiteTypesResponse, tradesResponse,
} from "../types/response";

const request_url = config.get("request_url");

export default class API {
    static async checkAccount(chatId: number): Promise<boolean> {
        let response = await fetch(request_url + "account/check?" + new URLSearchParams({
            chatId: chatId.toString(),
        }))
        let data = await response.json();
        return data.answer;
    }

    static async createVerificationCode(login: string, chatId: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "code/create", {
            method: "POST",
            body: JSON.stringify({
                login,
                chatId,
            })
        })
        return await response.json();
    }

    static async deleteCode(chatId: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "code/delete?" + new URLSearchParams({
            chatId: chatId.toString(),
        }), {
            method: "DELETE"
        })
        return await response.json();
    }

    static async checkCode(value: string, chatId: number): Promise<defaultWithAnswer> {
        let response = await fetch(request_url + "code/check?" + new URLSearchParams({
            chatId: chatId.toString(), value,
        }))
        return await response.json();
    }

    static async getBalance(chatId: number): Promise<balanceResponse> {
        let response = await fetch(request_url + "wallet/getBalance?" + new URLSearchParams({
            chatId: chatId.toString(),
        }))
        return await response.json();
    }

    static async getPurchases(chatId: number): Promise<purchaseResponse> {
        let response = await fetch(request_url + "trade/getbychatid?" + new URLSearchParams({
            chatId: chatId.toString(),
        }))
        return await response.json();
    }

    static async cancelTrade(chatId: number, tradeId: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "trade/cancel?" + new URLSearchParams({
            chatId: chatId.toString(), tradeId: tradeId.toString()
        }), {
            method: "DELETE"
        })
        return await response.json();
    }

    static async setTransfer(chatId: number, id: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "trade/transfer", {
            method: "POST",
            body: JSON.stringify({
                chatId,
                id,
            })
        })
        return await response.json();
    }

    static async getRequisiteTypes(): Promise<requisiteTypesResponse> {
        let response = await fetch(request_url + "wallet/getBalance");
        return await response.json();
    }

    static async getOffer(TypeId: number, chatId: number, value: number, start: number = 0, end: number = 10): Promise<offerResponse> {
        let response = await fetch(request_url + "trade/getOffer?" + new URLSearchParams({
            TypeId: TypeId.toString(),
            chatId: chatId.toString(),
            value: value.toString(),
            start: start.toString(),
            end: end.toString(),
        }))
        return await response.json();
    }

    static async buy(chatId: number, value: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "code/create", {
            method: "POST",
            body: JSON.stringify({
                chatId,
                value,
            })
        })
        return await response.json();
    }

    static async createTrade(traderChatId: number, value: number, price: number, buyerChatId: number, requisiteId: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "trade/create", {
            method: "POST",
            body: JSON.stringify({
                traderChatId, value, price, buyerChatId, requisiteId,
            })
        })
        return await response.json();
    }

    static async getTrades(chatId: number): Promise<tradesResponse> {
        let response = await fetch(request_url + "trade/getMy", {
            method: "POST",
            body: JSON.stringify({
                chatId,
            })
        })
        return await response.json();
    }

    static async confirmTrade(chatId: number, tradeId: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "trade/confirm", {
            method: "PUT",
            body: JSON.stringify({
                chatId, tradeId,
            })
        })
        return await response.json();
    }

    static async markTradeDone(buyerChatId: number, traderChatId: number, value: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "wallet/tradeDone", {
            method: "PUT",
            body: JSON.stringify({
                buyerChatId, traderChatId, value,
            })
        })
        return await response.json();
    }

    static async sendToSale(chatId: number, value: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "wallet/onsale", {
            method: "POST",
            body: JSON.stringify({
                chatId, value,
            })
        })
        return await response.json();
    }

    static async getRequisites(chatId: number): Promise<requisitesResponse> {
        let response = await fetch(request_url + "requisite/getAll?" + new URLSearchParams({
            chatId: chatId.toString(),
        }))
        return await response.json();
    }

    static async deleteRequisite(chatId: number, requisiteId: number): Promise<defaultResponse> {
        let response = await fetch(request_url + "requisite/delete?" + new URLSearchParams({
            chatId: chatId.toString(), requisiteId: requisiteId.toString()
        }), {
            method: "DELETE"
        })
        return await response.json();
    }

    static async updateRequisite(chatId: number, requisiteId: number, price: number, requisite: string): Promise<defaultResponse> {
        let response = await fetch(request_url + "requisite/update", {
            method: "PUT",
            body: JSON.stringify({
                chatId, requisiteId, price, requisite,
            })
        })
        return await response.json();
    }

    static async createRequisite(typeId: number, chatId: number, price: number, requisite: string): Promise<defaultResponse> {
        let response = await fetch(request_url + "requisite/create", {
            method: "POST",
            body: JSON.stringify({
                typeId, chatId, price, requisite,
            })
        })
        return await response.json();
    }
}