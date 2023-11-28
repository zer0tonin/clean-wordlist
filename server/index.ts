import { Ai } from "@cloudflare/ai";

export interface Env {
  AI: any;
}

const utf8Decoder = new TextDecoder("utf-8");

const processStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  result: Array<string>,
): Promise<void> => {
  const { value, done } = await reader.read();

  const decoded = value ? utf8Decoder.decode(value, { stream: true }) : "";
  if (decoded.startsWith("data: ")) {
    try {
      const data = JSON.parse(decoded.substring(6));
      result.push(data["response"]);
    } catch {
      // ignore
    }
  }

  if (!done) {
    await processStream(reader, result);
  }
};

const checkWord = async (ai: Ai, word: string): Promise<boolean> => {
  const messages = [
    {
      role: "system",
      content: "You check if words are offensive, reply using yes or no",
    },
    { role: "user", content: word },
  ];

  const stream = await ai.run("@cf/mistral/mistral-7b-instruct-v0.1", {
    messages,
    stream: true,
  });

  const reader = stream.getReader();
  const result: Array<string> = [];
  await processStream(reader, result);

  return result.join("").toLowerCase().includes("no");
};

export default {
  async fetch(request: Request, env: Env) {
    const ai = new Ai(env.AI);

    const words: Array<string> = await request.json();
    const isOffensive = await Promise.all(
      words.map((word) => checkWord(ai, word)),
    );
    const result = words.filter((_, index) => isOffensive[index]);

    return new Response(JSON.stringify(result), {
      headers: { "content-type": "text/event-stream" },
    });
  },
};
