import 'dotenv/config';
import { AgentService } from '../agent/agent.service';
import { TraceEvent } from '../types/profile';
import { PROVIDER_CATALOG, isConfigured } from '../llm/providers.config';

function printProviderConfiguration() {
  console.log('=== Provider Configuration ===');

  let activeCount = 0;
  for (const provider of PROVIDER_CATALOG) {
    if (isConfigured(provider)) {
      activeCount += 1;
      console.log(`OK   ${provider.name} - configured`);
    } else {
      console.log(`WARN ${provider.name} - no key (skipping)`);
    }
  }

  console.log(`Active providers: ${activeCount}`);
  console.log('NOTE  groq free tier: 100K tokens/day. Resets at midnight UTC.');
  console.log('      If quota_exceeded, wait for reset or use another provider key.');
  console.log('==============================');
  return activeCount;
}

async function main() {
  const username = process.argv[2] || 'rabby-xponent';
  console.log(`\n=== DevScope agent test: ${username} ===\n`);

  const activeCount = printProviderConfiguration();
  if (activeCount === 0) {
    console.error('No LLM providers are configured. Set at least one API key in backend/.env and try again.');
    process.exit(1);
  }

  const agent = new AgentService();

  const onEvent = (e: TraceEvent) => {
    if (e.type === 'tool_call') {
      console.log(`  -> ${e.tool}(${JSON.stringify(e.input)})`);
    } else if (e.type === 'tool_result') {
      console.log(`    ok ${e.summary}`);
    } else if (e.type === 'thinking' && e.thinking) {
      const prefix = e.thinking.startsWith('Synthesizing') ? '  [synthesis]' : '    ..';
      console.log(`${prefix} ${e.thinking}`);
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
