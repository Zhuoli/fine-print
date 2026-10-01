# What Zhuoli has to do (≈60–90 min), in order. Deadline: Sun Oct 4, 11:59 PM PT (aim for 9:59 PM PT)

Everything below needs your accounts. The agent did not sign up, publish, or submit anything.

1. ✅ **Sanity account** (robotonyszu@gmail.com), project "fine-print" created: **project ID `9wt4tu94`**, dataset `production`, **org ID `otr7jib55`** (filled into `.env.example`, studio config, README, DEV post).
2. ✅ Org → **Labs**: **Context** enabled (Free plan includes Agent Context). ⚠️ The **Knowledge Bases** option is **not shown** on the Free plan. Judging criterion #3 is "Use of Knowledge Bases", so: ask in Sanity Discord #mcp-server / the DEV launch post whether challenge entrants get KB beta access; meanwhile Path One also accepts "your full dataset through a Context MCP endpoint with embeddings enabled", so ship with the GROQ-mode MCP (+ embeddings if offered) and say so honestly in the post.
3. Create an **organization API token** with **Context Viewer**. Also create a project token with **Editor** for the seed import, or just run `npx sanity login` in `studio/` and the CLI uses your session.
4. In `studio/`: `npx sanity login` → `npx sanity schema deploy` → `npx sanity deploy` (hostname `fine-print`, or any free one).
5. From the root: `npm run seed:import`. Make the `production` dataset **public**.
6. Context app: build the KB per `kb/knowledge-base.md`, create the two MCPs, put the URLs + org token in `.env`, then run `npm run check:mcp`.
7. LLM key: optional but much better. An Anthropic or OpenAI key costs money, so **it's your call (rule: no spending)**. Without one, the live app runs the deterministic planner, which still answers every demo question.
8. **GitHub**: create a public repo `fine-print` and push. **Vercel** (Hobby, free): import it and add the env vars.
9. Fill the placeholders in `docs/DEV_POST.md` (`<VERCEL_URL>`, `<GITHUB_URL>`, `<PROJECT_ID>`, image URL), plus the "Knowledge Base vs. my conflicts" section after the KB build.
10. **DEV account** (robotonyszu@gmail.com) → New post → paste `docs/DEV_POST.md`. Check the tags (`devchallenge, sanitychallenge, sanity, ai`) → publish **yourself**.
11. Employer check: the Official Rules say "All Entries that violate an Entrant's employer's policies, will be deemed ineligible." Confirm your moonlighting/IP policy first.
