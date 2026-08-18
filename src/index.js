import { Agent, run, setDefaultOpenAIClient } from "@openai/agents";
import { openrouterClient } from "../client.js";

setDefaultOpenAIClient(openrouterClient);

const location = "us";

const helloAgent = new Agent({
	name: "hello-agent",
	instructions: function () {
		if (location === "india") {
			return `Always say namaste and then you are an agent that always say hello with user's name.`;
		} else {
			return `You are an agent that just talks to the user.`;
		}
	},
	model: "deepseek/deepseek-v4-flash-0731",
});

run(helloAgent, "Hello there my name is John").then((result) => {
	console.log(result.finalOutput);
});
