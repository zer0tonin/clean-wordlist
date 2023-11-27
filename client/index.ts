import { open } from "node:fs/promises";

const readDict = async (): Promise<void> => {
    const dictHandle = await open("./dict.txt", "r");
    for await (const line of dictHandle.readLines()) {
        console.log(line)
    }
    await dictHandle.close();
}

readDict();
