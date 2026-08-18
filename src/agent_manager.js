import { openrouterClient } from "../client.js";
import { Agent, run, setDefaultOpenAIClient, tool } from "@openai/agents";
import { z } from "zod";
import fs from "node:fs/promises";

setDefaultOpenAIClient(openrouterClient);

const fetchAvailablePlans = tool({
	name: "fetch_available_plans",
	description: "Fetches the available plans for internet broadband.",
	parameters: z.object({}),
	execute: async () => {
		return [
			{ planId: "1", price_inr: 399, speed: "30mbps" },
			{ planId: "2", price_inr: 999, speed: "100mbps" },
			{ planId: "3", price_inr: 1499, speed: "200mbps" },
		];
	},
});

const processRefund = tool({
	name: "process_refund",
	description: "Processes the refund request and returns the status.",
	parameters: z.object({
		customerId: z.string().describe("The customer's ID"),
		reason: z.string().describe("The reason for the refund"),
		amount: z.number().describe("The amount to be refunded"),
	}),
	execute: async ({ customerId, reason, amount }) => {
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

const refundAgent = new Agent({
	name: "refund-agent",
	instructions: `You are an expert in issuing refunds to the customer`,
	model: "openai/gpt-4o-mini",
	tools: [processRefund],
});

const salesAgent = new Agent({
	name: "sales-agent",
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

async function main(query = "") {
	const result = await run(salesAgent, query);
	console.log(result.finalOutput);
}

main("I had a plan of 399, i want a refund right now. my customer id is cust123 because I am shfiting to a new place");
