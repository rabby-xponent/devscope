import Anthropic from '@anthropic-ai/sdk';
import { toolDefinitions, executeTool, summarizeToolResult } from './tools/definitions';
import { SYSTEM_PROMPT } from './prompts';
import { DevProfile, TraceEvent } from '../types/profile';

const MAX_LOOPS = 14;
const MODEL = 'claude-sonnet-4-6';
const CACHE_VERSION = 1;

type EventEmitter = (event: TraceEvent) => void;

export class AgentService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async buildProfile(username: string, emit: EventEmitter): Promise<DevProfile> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Build a developer intelligence profile for the GitHub user: ${username}`,
      },
    ];

    let githubData: any = null;
    let repoData: any = null;

    for (let i = 0; i < MAX_LOOPS; i++) {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions as any,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;

          emit({
            type: 'tool_call',
            timestamp: new Date().toISOString(),
            tool: block.name,
            input: block.input as Record<string, unknown>,
          });

          let result: any;
          try {
            result = await executeTool(block.name, block.input as Record<string, any>);
            if (block.name === 'get_github_profile') githubData = result;
            if (block.name === 'get_repos' && !repoData) repoData = result;
          } catch (err: any) {
            const status = err.response?.status;
            if (status === 404) {
              result = { error: 'GitHub user or resource not found' };
            } else if (status === 403) {
              throw new Error('GitHub API rate limited. Try again in a minute.');
            } else {
              result = { error: err.message };
            }
          }

          emit({
            type: 'tool_result',
            timestamp: new Date().toISOString(),
            tool: block.name,
            summary: result.error ? `Error: ${result.error}` : summarizeToolResult(block.name, result),
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      // end_turn — parse the final JSON
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      const synthesized = this.parseProfileJson(text);
      return this.assembleProfile(username, synthesized, githubData, repoData);
    }

    throw new Error(`Agent did not finish within ${MAX_LOOPS} iterations.`);
  }

  private parseProfileJson(text: string): any {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Agent did not return valid JSON.');
    return JSON.parse(match[0]);
  }

  private assembleProfile(
    username: string,
    s: any,
    githubData: any,
    repoData: any
  ): DevProfile {
    return {
      username,
      generatedAt: new Date().toISOString(),
      cacheVersion: CACHE_VERSION,
      github: {
        name: githubData?.name || username,
        avatarUrl: githubData?.avatarUrl || '',
        bio: githubData?.bio || null,
        company: githubData?.company || null,
        location: githubData?.location || null,
        websiteUrl: githubData?.websiteUrl || null,
        followers: githubData?.followers ?? 0,
        following: githubData?.following ?? 0,
        publicRepos: githubData?.publicRepos ?? 0,
        joinedYear: githubData?.joinedYear ?? 0,
        totalStars: repoData?.totalStars ?? 0,
        totalForks: repoData?.totalForks ?? 0,
      },
      headline: s.headline || '',
      summary: s.summary || '',
      expertise: s.expertise || [],
      techEvolution: s.techEvolution || '',
      openSourceImpact: s.openSourceImpact || { narrative: '', topRepos: [] },
      communicationStyle: s.communicationStyle || '',
      webPresence: s.webPresence || { hackerNews: null, blog: null, other: null },
      strengths: s.strengths || [],
      growthAreas: s.growthAreas || [],
    };
  }
}
