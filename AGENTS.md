<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## Security Rules

- Never hard-code API keys, tokens, passwords, database URLs, or private credentials.
- Never print secrets in logs, comments, documentation, or test files.
- Use environment variables for all sensitive values.
- Use `.env.example` for required variable names.
- Do not modify `.env.local`.
- Do not commit `.env`, `.env.local`, or any file containing real credentials.
- If a secret is needed, reference it as `process.env.VARIABLE_NAME`.