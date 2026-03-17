Full ship workflow for stalk.ai: commit → deploy → verify.

1. **Check status**: Run `git status` and `git diff` to understand what changed.
2. **Commit**: Stage relevant files and create a descriptive commit (never use `--no-verify`).
3. **Deploy**: Use `mcp__claude_ai_Vercel__deploy_to_vercel` to trigger a deployment.
4. **Monitor**: Use `mcp__claude_ai_Vercel__get_deployment` to check the deployment status. If it fails, fetch build logs with `mcp__claude_ai_Vercel__get_deployment_build_logs` and report the error.
5. **Report**: Return the deployment URL when successful.

If there are TypeScript errors or lint failures in the commit hook, fix them before proceeding — never bypass with `--no-verify`.
