import { openrouterClient } from "../client.js";
import { Agent, run, setDefaultOpenAIClient, tool } from "@openai/agents";
import { z } from "zod";

setDefaultOpenAIClient(openrouterClient);
let sharedHistory = [];

const executeSql = tool({
	name: "execute_sql",
	description: "Executes a SQL query and returns the result.",
	parameters: z.object({
		sql: z.string().describe("The SQL query to execute"),
	}),
	execute: async ({ sql }) => {
		console.log(`[SQL]: Execute ${sql}`);
		return "done";
	},
});

const sqlAgent = new Agent({
	name: "SQL Query Agent",
	tools: [executeSql],
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
	model: "openai/gpt-4o-mini",
});

async function main(query = "") {
	sharedHistory.push({ role: "user", content: query });
	const result = await run(sqlAgent, sharedHistory);
	sharedHistory = result.history;
	// console.log(result);
	console.log("Final Output: ", result.finalOutput);
}

// Turn 1
main("hello my name is Gopal").then(() => {
	// Turn 2
	main("get me all the users with my name");
});
