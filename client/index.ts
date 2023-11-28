import { open, FileHandle } from "node:fs/promises";

// saves the current progress
const save = async (saveHandle: FileHandle, count: number): Promise<void> => {
  await saveHandle.truncate(0);
  await saveHandle.write(`${count}\n`, 0);
};

// loads the current progress
const load = async (): Promise<number> => {
  const saveHandle = await open("./save.txt", "r");
  const content = await saveHandle.readFile();
  const res = parseInt(content.toString());
  await saveHandle.close();
  return res;
};

// wrapper around setTimeout
const timeout = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// sends a request to cloudflare
const requestServer = async (words: Array<string>): Promise<Array<string>> => {
  try {
    const resp = await fetch(process.env.SERVER_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(words),
    });
    const res = (await resp.json()) as Array<string>;
    return res;
  } catch {
    // probably hit the rate limit
    await timeout(60000);
    return await requestServer(words);
  }
};

// write words to result.txt
const writeResult = async (
  resultHandle: FileHandle,
  words: Array<string>,
): Promise<void> => {
  for (const i in words) {
    await resultHandle.appendFile(words[i] + "\n");
  }
};

const main = async (): Promise<void> => {
  let progress = 0;
  try {
    progress = await load();
  } catch {
    console.log("Couldn't open save.txt, starting from index 0");
  }

  const resultHandle = await open("result.txt", "a");
  const dictHandle = await open("./dict.txt", "r");
  const saveHandle = await open("./save.txt", "w+");

  const lines: Array<string> = [];
  for await (const line of dictHandle.readLines()) {
    lines.push(line);
  }

  while (progress < lines.length) {
    try {
      const nextWords = lines.filter(
        (_, i) => i >= progress && i < progress + 5,
      );
      const filteredWords = await requestServer(nextWords);
      progress = progress + 5;
      await save(saveHandle, progress);
      const promises = [
        writeResult(resultHandle, filteredWords),
        save(saveHandle, progress),
        timeout(1000),
      ];
      await Promise.all(promises);
      console.log(`Progress: ${progress}`);
    } catch (err) {
      console.log(err);
      return;
    }
  }

  resultHandle.close();
  dictHandle.close();
  saveHandle.close();
};

main();
