import { Ai } from '@cloudflare/ai'

export interface Env {
  AI: any;
}

const utf8Decoder = new TextDecoder("utf-8");

const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, result: Array<string>) => {
  const { value, done } = await reader.read();

  const decoded = value ? utf8Decoder.decode(value, { stream: true}) : "";
  if (decoded.startsWith("data: ")) {
    try {
      const data = JSON.parse(decoded.substring(6));
      result.push(data["response"]);
    } catch {
      // ignore
    }
  }

  if (!done) {
    await processStream(reader, result)
  }
}

const runAI = async (ai: Ai, word: string) => {

    const messages = [
      { role: 'system', content: 'You are tasked to determine if words are offensive or not and can only reply using yes or no' },
      { role: 'user', content: word },
    ];

    const stream = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', {
      messages,
      stream: true
    });

    const reader = stream.getReader();
    const result: Array<string> = [];
    await processStream(reader, result);
    console.log(result.join(''));
}

export default {
  async fetch(request: Request, env: Env) {
    const ai = new Ai(env.AI);

    await runAI(ai, "rape")
    await runAI(ai, "flower")
    await runAI(ai, "fuck")
    await runAI(ai, "pangolin")
    await runAI(ai, "murder")

    return new Response(
      "ok",
      { headers: { "content-type": "text/event-stream" } }
    );
  },
};
