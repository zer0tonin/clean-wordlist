# clean-wordlist

Generates a sanitized wordlist using LLMs.
Base dictionary taken from [dwyl/english-words](https://github.com/dwyl/english-words).

Directly find the result [here](https://github.com/zer0tonin/clean-wordlist/blob/main/client/result.txt).

# Server

The server uses Cloudflare's Workers AI to host Mistral 7B.
Launch it by doing:

```sh
cd server
npm install
npx wrangler login # requires a cloudflare account
npx wrangler dev --remote
```

# Client

The client will send the server words 5 by 5 to build the `result.txt` file.
The process takes around 20h, so you might want to just use the results I provided.

Launch it by doing:

```sh
cd client
npm install
SERVER_URL="http://localhost:8787" npm run start
```
