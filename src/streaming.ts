import { openrouterClient } from "../client.js";
import { Agent, run, setDefaultOpenAIClient } from "@openai/agents";
import { z } from "zod";
setDefaultOpenAIClient(openrouterClient);

const agent = new Agent({
	name: "Storyteller",
	instructions:
		"You are a storyteller. You will be given a topic and you will tell a story about it.",
	model: "openai/gpt-4o-mini",
});

async function* streamOutput(query: string) {
	const result = await run(agent, query, { stream: true });
	const stream = result.toTextStream();

	for await (const val of stream) {
		yield { isCompleted: false, value: val };
	}

    yield { isCompleted: true, value: result.finalOutput };
}

async function main(query: string) {
	// const result = await run(agent, query, { stream: true });
	// result.toTextStream({ compatibleWithNodeStreams: true }).pipe(process.stdout);

	// const stream = result.toTextStream()
	// for await (const val of stream) {
	//     console.log(val);
	// }

    for await (const val of streamOutput(query)) {
        console.log(val);
    }
}

main("Write me a poem of 50 words about the robots");
