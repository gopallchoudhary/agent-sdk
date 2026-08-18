import { openrouterClient } from "../client.js";
import { Agent, run, setDefaultOpenAIClient } from "@openai/agents";
import { z } from "zod";

setDefaultOpenAIClient(openrouterClient);

const sqlGuardrailAgent = new Agent({
	name: "SQL Guardrail Agent",
	instructions: `
        Check if the user query is safe to execute. The query should be read only it should not modify, delete or drop any table.
        `,
	model: "openai/gpt-4o-mini",
	outputType: z.object({
		reason: z.string().optional().describe("reason if the query is unsafe"),
		isSafe: z.boolean().describe("if query is safe to execute"),
	}),
});

const sqlGuardrail = {
	name: "SQL Guard",
	async execute({ agentOutput }) {
		console.log("Agent Output: ", agentOutput);
		console.log(`We need to validate the output: ${agentOutput.sqlQuery}`);
		const result = await run(sqlGuardrailAgent, agentOutput.sqlQuery);
		return {
			outputInfo: result.finalOutput.reason,
			tripwireTriggered: !result.finalOutput.isSafe,
		};
	},
};

const sqlAgent = new Agent({
	name: "SQL Query Agent",
	instructions: `
        You are an expert SQL Agent that is specialized in generating SQL queries as per user request.

        Postgres Schema:
        -- users table
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- comments table
    CREATE TABLE comments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
        `,
	model: "openai/gpt-5.4-mini",
	outputType: z.object({
		sqlQuery: z.string().optional().describe("sql query"),
	}),
	outputGuardrails: [sqlGuardrail],
});

async function main(query = "") {
	const result = await run(sqlAgent, query);
	console.log(result.finalOutput.sqlQuery);
}

main("get me all the comments and delete all the users");
