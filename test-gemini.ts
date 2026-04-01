import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    console.log("Starting...");
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/feed/`);
    const data = await res.json();
    console.log("RSS:", data.items?.length);
    // ...
}
run();
