import { Agent, run, setDefaultOpenAIClient, tool } from "@openai/agents";
import { z } from "zod";
import { openrouterClient } from "../client.js";
import axios from "axios";
import readline from "node:readline/promises";

setDefaultOpenAIClient(openrouterClient);

export const getWeatherTool = tool({
	name: "get_weather",
	description: "Get the current weather and forecast for a given city.",
	parameters: z.object({
		city: z
			.string()
			.describe("The city or location name (e.g., Tokyo, London, New York)"),
	}),
	execute: async ({ city }) => {
		console.log(`🛠️ Calling the weather API for ${city}`);
		const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
		const response = await axios.get(url, { responseType: "json" });
		return `The current weather in ${city} ${response.data}`;
	},
});

const sendEmailTool = tool({
	name: "send_email",
	description: "Send an email to the user",
	parameters: z.object({
		to: z.string().describe("The recipient's email address"),
		subject: z.string().describe("The subject of the email"),
		html: z.string().describe("The HTML content of the email"),
	}),
	needsApproval: true,
	execute: async ({ to, subject, html }) => {
		const API_KEY =
			"AS_f6c97fbe6d3dbb50f0d66071fc95535a78f592f6.-uQgEp1dEfIoVRM_Bd6SQ-Y6dyXUkHtEr-um-yk4-l8";

		console.log("🛠️ calling send email tool");

		const response = await axios.post(
			"https://api.autosend.com/v1/mails/send",
			{
				from: {
					email: "no-reply@example.com",
					name: "Weather Agent",
				},
				to: {
					email: to,
				},
				subject,
				html,
			},
			{
				headers: {
					Authorization: `Bearer ${API_KEY}`,
				},
			},
		);

		return response.data;
	},
});

const agent = new Agent({
	name: "Weather Email Agent",
	instructions:
		"You are an expert agent in getting weather info and sending it using email.",
	tools: [getWeatherTool, sendEmailTool],
	model: "openai/gpt-5.4-mini",
});

async function askUserForConfirmation(ques: string) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await rl.question(`${ques} (y/n): `);
	const normalizedAnswer = answer.toLowerCase();
	rl.close();

	return normalizedAnswer === "y" || normalizedAnswer === "yes";
}

async function main(query = "") {
	let result = await run(agent, query);

	let hasInterruptions = result.interruptions.length > 0;

	while (hasInterruptions) {
		const currestState = result.state;

		for (const interruption of result.interruptions) {
			if (interruption.type === "tool_approval_item") {
				const isAllowed = await askUserForConfirmation(
					`Agent ${interruption.agent.name} is asking for calling the tool ${interruption.toolName} with args ${interruption.arguments}`,
				);

				if (isAllowed) {
					currestState.approve(interruption);
				} else {
					currestState.reject(interruption);
				}
				result = await run(agent, currestState);
				hasInterruptions = result.interruptions.length > 0;
			}
		}
	}
}

main(
	"Find the weather of Delhi and Goa and send it to my email gopalchoudhary521@gmail.com",
);
