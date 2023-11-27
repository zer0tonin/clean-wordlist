import { open } from "node:fs/promises";
import { createInterface } from "node:readline";

// reads 1000 lines from the dictionary
const readDict = async (startingPoint: number): Promise<void> => {
    const dictHandle = await open("./dict.txt", "r");
    const readable = dictHandle.createReadStream();
    const reader = createInterface({ input: readable });

    let lines: Array<string> = await new Promise((resolve) => {
        const result: Array<string> = [];
        let counter = 0;
        reader.on('line', (line) => {
            if (counter >= startingPoint && counter < startingPoint + 1000) {
                result.push(line);
                counter++;
            } else if (counter < startingPoint + 1000) {
                counter++;
            } else {
                reader.close();
            }
        });
        reader.on('close', () => {
            resolve(result);
        });
    });

    // we ignore words longer than 3 chars
    lines = lines.filter((word) => word.length > 2);

    reader.close()
    readable.close();
    dictHandle.close();
}

// saves the current progress
const save = async (count: number): Promise<void> => {
    const saveHandle = await open("./save.txt", "w");
    await saveHandle.writeFile(`${count}`)
    saveHandle.close()
};

// loads the current progress
const load = async (): Promise<number> => {
    const saveHandle = await open("./save.txt", "r");
    const content = await saveHandle.readFile();
    saveHandle.close();
    return parseInt(content.toString());
}

// wrapper around setTimeout
const timeout = async (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const main = async (): Promise<void> => {
    let progress = 0;
    try {
        progress = await load();
    } catch {
        console.log("No save.txt found, starting at index 0");
    }

    while (progress < 370105) {
        await readDict(progress);
        progress = progress + 1000
        await save(progress);
        await timeout(60000)
    }
}

main()
