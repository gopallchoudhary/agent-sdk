import { Anthropic } from "@anthropic-ai/sdk";
import "dotenv/config";
const client = new Anthropic({
	apiKey: process.env.OPENROUTER_API_KEY,
	baseURL: "https://openrouter.ai/api",
});

const message = await client.messages.create({
	max_tokens: 1024,
	messages: [{ role: "user", content: "Hello, Claude" }],
	model: "anthropic/claude-3-haiku", // note: OpenRouter model slug, with the "anthropic/" prefix
});

for (const block of message.content) {
	if (block.type === "text") {
		console.log(block.text);
	}
}
