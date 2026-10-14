/**
 * Profile quality eval harness (M26 — engine quality).
 *
 * Two modes, one contract (`profile-schema.ts`):
 *
 *   npx tsx src/scripts/eval-profile.ts
 *       Offline regression: validates every cached profile in CACHE_DIR
 *       against the schema. No API keys needed. This is the gate you run
 *       after changing prompts, the schema, or the finalize step — a prompt
 *       edit that degrades output shows up here as new errors/warnings
 *       against known-good fixtures.
 *
 *   npx tsx src/scripts/eval-profile.ts --live <username> [--jd file.txt]
 *       Runs a real audit through AgentService (so it exercises the repair
 *       loop end-to-end), then validates the produced profile. Prints the
 *       trace thinking lines so schema/repair passes are visible.
 *
 * Exit code is 0 only when the run has zero schema errors (warnings never
 * fail the build — they are quality signal, not contract violations).
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { AgentService, CACHE_VERSION } from '../agent/agent.service';
import {
  validateProfileSynthesis,
  formatIssues,
  summarizeValidation,
} from '../agent/profile-schema';

interface ProfileFileResult {
  file: string;
  username: string;
  ok: boolean;
  errors: number;
  warnings: number;
}

function cacheDir(): string {
  return path.resolve(process.cwd(), process.env.CACHE_DIR || './cache/profiles');
}

function report(label: string, r: ReturnType<typeof validateProfileSynthesis>): boolean {
  const status = r.ok ? (r.warnings.length ? 'WARN' : 'PASS') : 'FAIL';
  console.log(`[${status}] ${label} — ${summarizeValidation(r)}`);
  if (r.errors.length) console.log(formatIssues(r.errors));
  if (r.warnings.length) console.log(formatIssues(r.warnings));
  return r.ok;
}

function runOffline(): never {
  const dir = cacheDir();
  if (!fs.existsSync(dir)) {
    console.error(`No cache directory at ${dir} — run an audit first or use --live.`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error(`No cached profiles in ${dir} — run an audit first or use --live.`);
    process.exit(1);
  }

  console.log(`=== Profile schema regression: ${files.length} cached profiles in ${dir} ===\n`);

  const results: ProfileFileResult[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    let parsed: { cacheVersion?: number; username?: string };
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (err) {
      console.log(`[FAIL] ${file} — unreadable JSON: ${(err as Error).message}`);
      results.push({ file, username: file, ok: false, errors: 1, warnings: 0 });
      continue;
    }

    // Same rule as cache.service.ts: fixtures written under an older contract
    // would never be served, so they are not valid regression targets for the
    // current schema. Listed for transparency, not scored.
    if (parsed.cacheVersion !== undefined && parsed.cacheVersion !== CACHE_VERSION) {
      skipped.push(`${file} (cacheVersion ${parsed.cacheVersion} != ${CACHE_VERSION})`);
      continue;
    }

    const r = validateProfileSynthesis(parsed);
    const username = parsed.username || file.replace(/\.json$/, '');
    if (!report(`${file} (@${username})`, r)) {
      // keep going — we want the full picture, not just the first failure
    }
    results.push({ file, username, ok: r.ok, errors: r.errors.length, warnings: r.warnings.length });
    console.log('');
  }

  if (skipped.length) {
    console.log(`Skipped ${skipped.length} stale fixture(s) (pre-current contract):`);
    skipped.forEach((s) => console.log(`  - ${s}`));
    console.log('');
  }

  if (results.length === 0) {
    console.error('No current-version fixtures to evaluate — run a live audit first (--live <user>).');
    process.exit(1);
  }

  const failed = results.filter((r) => !r.ok);
  const totalWarnings = results.reduce((n, r) => n + r.warnings, 0);
  console.log('=== Summary ===');
  console.log(
    `${results.length - failed.length}/${results.length} profiles pass, ${totalWarnings} warnings total`
  );
  if (failed.length) {
    console.log(`Failing: ${failed.map((f) => f.file).join(', ')}`);
  }
  process.exit(failed.length ? 1 : 0);
}

async function runLive(username: string, jdFile?: string): Promise<void> {
  let jobDescription: string | undefined;
  let roleTitle: string | undefined;
  if (jdFile) {
    jobDescription = fs.readFileSync(jdFile, 'utf8');
    roleTitle = path.basename(jdFile, path.extname(jdFile));
    console.log(`JD attached from ${jdFile} (${jobDescription.length} chars)\n`);
  }

  console.log(`=== Live audit eval: @${username} ===\n`);
  const agent = new AgentService();
  const t0 = Date.now();

  const onEvent = (e: { type: string; tool?: string; thinking?: string; summary?: string }) => {
    if (e.type === 'tool_call') console.log(`  -> ${e.tool}`);
    else if (e.thinking) console.log(`    .. ${e.thinking}`);
  };

  const profile = await agent.buildProfile(username, onEvent, undefined, jobDescription, roleTitle);
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n=== Audit finished in ${seconds}s — validating output ===\n`);
  const ok = report(`live:@${username}`, validateProfileSynthesis(profile));

  console.log('\n=== Headline check (human judgment) ===');
  console.log(`headline: ${profile.headline}`);
  console.log(`summary : ${String(profile.summary).slice(0, 200)}...`);
  console.log(`expertise: ${(profile.expertise || []).map((e: { language: string }) => e.language).join(', ')}`);

  process.exit(ok ? 0 : 1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const liveIdx = args.indexOf('--live');

  if (liveIdx !== -1) {
    const username = args[liveIdx + 1];
    if (!username || username.startsWith('--')) {
      console.error('Usage: eval-profile.ts --live <github-username> [--jd <file>]');
      process.exit(1);
    }
    const jdIdx = args.indexOf('--jd');
    const jdFile = jdIdx !== -1 ? args[jdIdx + 1] : undefined;
    await runLive(username, jdFile);
    return;
  }

  runOffline();
}

main().catch((err) => {
  console.error('EVAL FAILED:', err.message);
  process.exit(1);
});
