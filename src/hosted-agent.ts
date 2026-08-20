import { openrouterClient } from "../client.js";
import { Agent, setDefaultOpenAIClient, hostedMcpTool, run } from "@openai/agents";

setDefaultOpenAIClient(openrouterClient);

const agent = new Agent({
	name: "MCP Assistant",
	instructions: "You must always the MCP tools to answer the question.",
	tools: [
		hostedMcpTool({
			serverLabel: "gitmcp",
			serverUrl: 'https://gitmcp.io/openai/codex',
		}),
	],
    model: "openrouter/free",
});


async function main(query: string) {
    const result = await run(agent, query);
    console.log(result.finalOutput);
}

main('What is this repo about?')