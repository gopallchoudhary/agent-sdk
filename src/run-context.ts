import { openrouterClient } from "../client.js";
import {
	Agent,
	run,
	setDefaultOpenAIClient,
	RunContext,
	tool,
} from "@openai/agents";
import { z } from "zod";
setDefaultOpenAIClient(openrouterClient);

interface MyContext {
	userId: string;
	userName: string;

	fetchUserInfoFromDB: () => Promise<string>;
}

const getUserInfoTool = tool({
	name: "get_user_info",
	description: "Get user information",
	parameters: z.object({}),
	execute: async (
		_,
		ctx?: RunContext<MyContext>,
	): Promise<string | undefined> => {
		const resutl = await ctx?.context.fetchUserInfoFromDB();
		return resutl;
	},
});

const customerSupportAgent = new Agent<MyContext>({
	name: "Customer Support Agent",
	tools: [getUserInfoTool],
	instructions: ({ context }) => {
		return `You are an expert customer support agent`;
	},
});

async function main(query: string, ctx: MyContext) {
	const result = await run(customerSupportAgent, query, { context: ctx });
	console.log("Final Output: ", result.finalOutput);
}

main("hey what is my name", {
	userId: "1",
	userName: "Gopal Choudhary",
	fetchUserInfoFromDB: async () => "userId=1, userName=GopalChoudhary",
});
