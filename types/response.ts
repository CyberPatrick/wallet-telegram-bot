export interface defaultResponse {
    statusCode: number;
    message: string;
}
export interface defaultWithAnswer extends defaultResponse{
    answer: boolean;
}
export interface balanceResponse extends defaultResponse {
    balance: number; // TODO узнать о формате
    onsale: number;
    onwork: number;
}
// export interface
export interface requisiteTypesResponse extends defaultResponse {
    requisiteTypes: [{
        id: number;
        currency: string;
        org: string;
    }]
}
export interface offerResponse extends defaultResponse {
    trades: Trade[]
}
export interface Trade {
    traderChatId: number,
    value: number;
    price: number;
    walletId: string;
    requisiteId: number;
}
export interface userTrade {
    id: number;
    traderChatId: number,
    value: number;
    price: number;
    buyerChatId: number;
    requisiteId: number;
    transfer: boolean;
    transferdateCreation: string;
}
export interface tradesResponse extends defaultResponse {
    trades: userTrade[];
}
export interface purchase {
    id: number;
    traderChatId: number,
    value: number;
    price: number;
    transfer: boolean;
    currency: string;
    organisation: string;
    creationDate: string;
}
export interface purchaseResponse extends defaultResponse {
    trades: purchase[];
}