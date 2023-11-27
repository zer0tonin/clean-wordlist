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

export default {
  async fetch(request: Request, env: Env) {
    const ai = new Ai(env.AI);

    const messages = [
      { role: 'system', content: 'You are a friendly assistant' },
      { role: 'user', content: 'What is the origin of the phrase Hello, World' }
    ];

    const stream = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages,
      stream: true
    });

    const reader = stream.getReader();
    const result: Array<string> = [];
    await processStream(reader, result);
    console.log(result.join(''));

    return new Response(
      "ok",
      { headers: { "content-type": "text/event-stream" } }
    );
  },
};
