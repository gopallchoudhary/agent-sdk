import { openrouterClient } from "../client.js";
import {
	Agent,
	run,
	setDefaultOpenAIClient,
	InputGuardrailTripwireTriggered,
} from "@openai/agents";
import { z } from "zod";
setDefaultOpenAIClient(openrouterClient);

const mathsInputGuardrailAgent = new Agent({
	name: "Maths Input Agent",
	instructions: `
				You are an inupt guardrail agent for maths that checks the user query is related to maths or not.
				Rules:
				  - The question has to be strictly or straightforward maths questions.
				`,
	model: "openai/gpt-4o-mini",
	outputType: z.object({
		isValidMathsQuestion: z.boolean().describe("is the query related to maths"),
		reason: z.string().optional().describe("reason to reject the user query"),
	}),
});

const mathInputGuardrail = {
	name: "Math Homework Input Guardrail",
	execute: async ({ input }) => {
		console.log(`We need to validate the input: ${input}`);
		const result = await run(mathsInputGuardrailAgent, input);

		return {
			outputInfo: result.finalOutput.reason,
			tripwireTriggered: !result.finalOutput.isValidMathsQuestion,
		};
	},
};

const mathsAgent = new Agent({
	name: "Maths Agent",
	instructions: `You are an expert maths ai agent.`,
	model: "openai/gpt-5.4-mini",
	inputGuardrails: [mathInputGuardrail],
});

async function main(query = "") {
	try {
		const result = await run(mathsAgent, query);
		console.log(result.finalOutput);
	} catch (error) {
		if (error instanceof InputGuardrailTripwireTriggered) {
			console.log(`Invalid input: ${error.message}`);
		}
	}
}

main("Write a code in js to find circumference of a circle");
