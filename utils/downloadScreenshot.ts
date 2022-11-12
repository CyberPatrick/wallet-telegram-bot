import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";
import getExtension from "./getExtension";

export default async function downloadScreenshot(chatId: number, id: number, downloadLink: string): Promise<void> {
    let userFolderPath = path.join(__dirname, `../screens/${chatId}/`);
    await fs.ensureDir(userFolderPath);
    let extension = getExtension(downloadLink);
    let wStream = fs.createWriteStream(userFolderPath + `${id}.${extension}`);
    let response = await fetch(downloadLink);
    await new Promise((resolve, reject) => {
        response.body.pipe(wStream);
        response.body.on("end", () => resolve("success"));
        wStream.on("error", () => reject("failed"));
    })
    wStream.close();
}