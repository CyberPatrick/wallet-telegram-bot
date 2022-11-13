import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";
import getExtension from "./getExtension";

export default async function uploadScreenshot(chatId: number, id: number): Promise<fs.ReadStream> {
    let folderPath = path.join(__dirname, `../screens/${chatId}/`);
    let allScreenshotsInDir = await fs.readdir(folderPath);
    for (let screenShoot of allScreenshotsInDir) {
        let fileName, extension = screenShoot.split(".");
        if (fileName === id.toString()) {
            return fs.createReadStream(folderPath + screenShoot);
        }
    }
}