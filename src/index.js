import "dotenv/config";
import {
	Agent,
	run,
	setDefaultOpenAIClient,
} from "@openai/agents";
import { OpenAI } from "openai";

const client = new OpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	baseURL: process.env.OPENROUTER_BASE_URL,
});

setDefaultOpenAIClient(client);


const helloAgent = new Agent({
	name: "hello-agent",
	instructions: `You are an agent that always says hello world.`,
	model: "openai/gpt-4o-mini",
});

run(helloAgent, "Hello there my name is John").then((result) => {
	console.log(result.finalOutput);
});
