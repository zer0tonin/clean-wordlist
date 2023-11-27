import { open } from "node:fs/promises";
import { createInterface } from "node:readline";

const readDict = async (startingPoint: number): Promise<void> => {
    const dictHandle = await open("./dict.txt", "r");
    const readable = dictHandle.createReadStream();
    const reader = createInterface({ input: readable });

    let lines: Array<string> = await new Promise((resolve) => {
        const result: Array<string> = [];
        let counter = 0;
        reader.on('line', (line) => {
            if (counter >= startingPoint && counter < startingPoint + 100) {
                result.push(line);
                counter++;
            } else if (counter < startingPoint + 100) {
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

    console.log(lines.join())
    reader.close()
    readable.close();
    dictHandle.close();
}

const save = async (count: number): Promise<void> => {
    const saveHandle = await open("./save.txt", "w");
    await saveHandle.writeFile(`${count}`)
    saveHandle.close()
};

const load = async (): Promise<number> => {
    const saveHandle = await open("./save.txt", "r");
    const content = await saveHandle.readFile();
    console.log(parseInt(content.toString()));
    saveHandle.close();
    return parseInt(content.toString());
}
