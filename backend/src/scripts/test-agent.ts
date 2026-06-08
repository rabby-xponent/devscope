import 'dotenv/config';
import { AgentService } from '../agent/agent.service';
import { TraceEvent } from '../types/profile';

async function main() {
  const username = process.argv[2] || 'rabby-xponent';
  console.log(`\n=== DevScope agent test: ${username} ===\n`);

  const agent = new AgentService();

  const onEvent = (e: TraceEvent) => {
    if (e.type === 'tool_call') {
      console.log(`  → ${e.tool}(${JSON.stringify(e.input)})`);
    } else if (e.type === 'tool_result') {
      console.log(`    ✓ ${e.summary}`);
    }
  };

  const start = Date.now();
  const profile = await agent.buildProfile(username, onEvent);
  const seconds = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n=== Profile generated in ${seconds}s ===\n`);
  console.log(JSON.stringify(profile, null, 2));
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
