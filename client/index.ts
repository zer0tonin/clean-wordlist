import { open, FileHandle } from "node:fs/promises";


// saves the current progress
const save = async (saveHandle: FileHandle, count: number): Promise<void> => {
    await saveHandle.truncate()
    await saveHandle.writeFile(`${count}\n`)
};

// loads the current progress
const load = async (saveHandle: FileHandle): Promise<number> => {
    const content = await saveHandle.readFile();
    const res = parseInt(content.toString());
    console.log(res) // why the fuck is it literally always NaN
    return 0;
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
const writeResult = async (resultHandle: FileHandle, words: Array<string>): Promise<void> => {
    for (const i in words) {
         await resultHandle.appendFile(words[i] + "\n")
    }
}

const main = async (): Promise<void> => {
    const saveHandle = await open("./save.txt", "r+");
    let progress = 0;
    progress = await load(saveHandle);

    const resultHandle = await open("result.txt", "a");
    const dictHandle = await open("./dict.txt", "r");
    
    const lines: Array<string> = [];
    for await (const line of dictHandle.readLines()) {
        lines.push(line)
    }

    while (progress < lines.length) {
        try {
            // we ignore words of more than 2 chars
            const nextWords = lines.filter((v, i) => i >= progress && i < progress + 10 && v.length > 2)
            console.log(nextWords.join())
            //const filteredWords = await requestServer(nextWords);
            progress = progress + 10
            await save(saveHandle, progress)
            const promises = [
                //writeResult(resultHandle, filteredWords),
                save(saveHandle, progress),
                timeout(1000),
            ];
            await Promise.all(promises)
            console.log(`Progress: ${progress}`)
        } catch (err) {
            console.log(err)
            return
    }
}

resultHandle.close()
saveHandle.close();
}

main()
