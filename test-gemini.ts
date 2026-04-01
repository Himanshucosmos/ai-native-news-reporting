import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
  console.log("Starting test...");
  try {
    const rssUrl = 'https://techcrunch.com/feed/';
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const data = await res.json();
    console.log("RSS raw status:", res.status, data.status);
    
    const items = data.items?.slice(0, 4) || [];
    console.log("Items fetched:", items.length);

    if (items.length === 0) {
      console.log("Items empty, aborting.");
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const rawDigests = items.map((item: any, i: number) => {
      const cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '').substring(0, 300);
      return `STORY ${i+1}: \nTitle: ${item.title}\nSource: Tech\nSnippet: ${cleanDesc}`;
    }).join('\n\n');

    console.log("Sending to Gemini:", rawDigests.substring(0, 200) + "...");

    const prompt = `You are an editor. Format as JSON ARRAY of objects.
[
  {
    "aiHeadline": "Test",
    "aiSummary": "Test",
    "aiCategory": "TECH",
    "readTime": 2
  }
]
Raw Stories:\n${rawDigests}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    console.log("Raw Gemini Output:", text);
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);
    console.log("SUCCESS parsed items:", aiData.length);
  } catch (error) {
    console.error("Aggregation Failed:", error);
  }
}
run();
