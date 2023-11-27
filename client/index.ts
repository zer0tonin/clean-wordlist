import { open } from "node:fs/promises";
import { createInterface } from "node:readline";

// reads 10 lines from the dictionary
const readDict = async (startingPoint: number): Promise<Array<string>> => {
    const dictHandle = await open("./dict.txt", "r");
    const readable = dictHandle.createReadStream();
    const reader = createInterface({ input: readable });

    let lines: Array<string> = await new Promise((resolve) => {
        const result: Array<string> = [];
        let counter = 0;
        reader.on('line', (line) => {
            if (counter >= startingPoint && counter < startingPoint + 10) {
                result.push(line);
                counter++;
            } else if (counter < startingPoint + 10) {
                counter++;
            } else {
                reader.close();
            }
        });
        reader.on('close', () => {
            resolve(result);
        });
    });


    reader.close()
    readable.close();
    dictHandle.close();

    // we ignore words longer than 3 chars
    return lines.filter((word) => word.length > 2);
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

// sends a request to cloudflare
const requestServer = async (words: Array<string>): Promise<Array<string>> => {
    const resp = await fetch(process.env.SERVER_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(words),
    })
    const res = (await resp.json() as Array<string>)
    return res
}

// write words to result.txt
const writeResult = async (words: Array<string>): Promise<void> => {
    const resultHandle = await open("result.txt", "a");
    for (const i in words) {
         await resultHandle.appendFile(words[i] + "\n")
    }
    resultHandle.close()
}

const main = async (): Promise<void> => {
    let progress = 0;
    try {
        progress = await load();
    } catch {
        console.log("No save.txt found, starting at index 0");
    }

    while (progress < 370105) {
        try {
            const words = await readDict(progress);
            const filteredWords = await requestServer(words);
            progress = progress + 10
            const promises = [
                writeResult(filteredWords),
                save(progress),
                timeout(1000),
            ];
            await Promise.all(promises)
        } catch (err) {
            console.log(err)
            return
        }
    }
}

main()
