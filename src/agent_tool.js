import { Agent, run, setDefaultOpenAIClient, tool } from "@openai/agents";
import { z } from "zod";
import { openrouterClient } from "../client.js";
import axios from "axios";

// Configure default client to use OpenRouter
setDefaultOpenAIClient(openrouterClient);

const GetWeatherResultSchema = z.object({
	weather_reports: z
		.array(
			z.object({
				city: z.string().describe("The city or location name"),
				degree_c: z.number().describe("The degree celsius of the temperature"),
				condition: z
					.string()
					.optional()
					.describe("The current weather condition"),
			}),
		)
		.describe("List of weather reports for all requested cities"),
});

// Define the weather tool using Zod schema for input validation
export const getWeatherTool = tool({
	name: "get_weather",
	description: "Get the current weather and forecast for a given city.",
	parameters: z.object({
		city: z
			.string()
			.describe("The city or location name (e.g., Tokyo, London, New York)"),
	}),
	execute: async ({ city }) => {
		console.log(`🔨 Calling the weather API for ${city}`);
		const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
		const response = await axios.get(url, { responseType: "json" });
		return `The current weather in ${city} ${response.data}`;
	},
});

const sendEmailTool = tool({
	name: "send_email",
	description: "Send an email to a recipient with a subject and body.",
	parameters: z.object({
		recipient: z.string().describe("The recipient's email address"),
		subject: z.string().describe("The subject of the email"),
		body: z.string().describe("The body of the email"),
	}),
	execute: async ({ body, recipient, subject }) => {},
});

// Create the Weather Agent
export const agent = new Agent({
	name: "Weather agent",
	instructions:
		"You are a helpful weather assistant. When the user asks about the weather in any location, use the get_weather tool to fetch current conditions and present the weather report clearly and politely.",
	model: "openai/gpt-4o-mini",
	tools: [getWeatherTool, sendEmailTool],
	outputType: GetWeatherResultSchema,
});

async function main(query = "") {
	const result = await run(agent, query);
	console.log(result.finalOutput);
}

main("What is the weather in Goa, Delhi and Mumbai?");
