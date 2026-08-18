import { openrouterClient } from "../client.js";
import { Agent, run, setDefaultOpenAIClient, tool } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
import { z } from "zod";
import fs from "node:fs/promises";

setDefaultOpenAIClient(openrouterClient);

//, tool - fetch available plans
const fetchAvailablePlans = tool({
	name: "fetch_available_plans",
	description: "Fetches the available plans for internet broadband.",
	parameters: z.object({}),
	execute: async () => {
		console.log(`🛠️ calling fetch available plans tool.`);
		return [
			{ planId: "1", price_inr: 399, speed: "30mbps" },
			{ planId: "2", price_inr: 999, speed: "100mbps" },
			{ planId: "3", price_inr: 1499, speed: "200mbps" },
		];
	},
});

//, tool - process refund
const processRefund = tool({
	name: "process_refund",
	description: "Processes the refund request and returns the status.",
	parameters: z.object({
		customerId: z.string().describe("The customer's ID"),
		reason: z.string().describe("The reason for the refund"),
		amount: z.number().optional().describe("The amount to be refunded"),
	}),
	execute: async ({ customerId, reason, amount }) => {
		console.log(`🛠️ calling process refund tool.`);
		await fs.appendFile(
			"refunds.txt",
			`Customer ID: ${customerId}, Reason: ${reason}, Amount: ${amount}\n`,
			"utf-8",
		);

		return {
			refundIssued: true,
		};
	},
});

//. agetn - refund agent
const refundAgent = new Agent({
	name: "Refund Agent",
	instructions: `You are an expert in issuing refunds to the customer`,
	model: "openai/gpt-4o-mini",
	tools: [processRefund],
});

//. agent - sales agent
const salesAgent = new Agent({
	name: "Sales Agent",
	instructions: `You are an expert sales agent of a internet broadband company, who talks to the user and resolves their queries.`,
	model: "openai/gpt-4o-mini",
	tools: [
		fetchAvailablePlans,
		refundAgent.asTool({
			name: "refund_expert",
			description: "Handles refund questions and requests",
		}),
	],
});

//. agent - reception agent

const receptionAgent = new Agent({
	name: "Recection Agent",
	instructions: `
        ${RECOMMENDED_PROMPT_PREFIX}
        You are the customer facing agent expert in understanding what customer needs and then route them or handoff them to the right agent.`,
	model: "openai/gpt-4o-mini",
	handoffDescription: `You have two agents available: 
        - salesAgent: Export in handling queries like all plans and pricing. Good for new customers.
        - refundAgent: Export in handling users queries for existing customers and issue refunds to help them.
    `,
	handoffs: [salesAgent, refundAgent],
});

async function main(query = "") {
	const result = await run(receptionAgent, query);
	console.log(result.finalOutput);
	console.log(result.history);
}

main(
	"Hi there, I am a customer having customer id cust_2345 and I want to have a refund request of my 999 plan as i am facing slow internet connection.",
);
