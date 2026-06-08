import OpenAI from 'openai';
import { toolDefinitions, executeTool, summarizeToolResult } from './tools/definitions';
import { SYSTEM_PROMPT } from './prompts';
import { DevProfile, TraceEvent } from '../types/profile';

const MAX_LOOPS = 14;
const CACHE_VERSION = 1;

// Provider-agnostic config. Defaults to Gemini's OpenAI-compatible endpoint.
const LLM_BASE_URL =
  process.env.LLM_BASE_URL ||
  'https://generativelanguage.googleapis.com/v1beta/openai/';
const LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash';
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '';

type EventEmitter = (event: TraceEvent) => void;
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class AgentService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: LLM_API_KEY, baseURL: LLM_BASE_URL });
  }

  async buildProfile(username: string, emit: EventEmitter): Promise<DevProfile> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Build a developer intelligence profile for the GitHub user: ${username}`,
      },
    ];

    let githubData: any = null;
    let repoData: any = null;

    for (let i = 0; i < MAX_LOOPS; i++) {
      const response = await this.client.chat.completions.create({
        model: LLM_MODEL,
        messages,
        tools: toolDefinitions,
        max_tokens: 4096,
      });

      const choice = response.choices[0];
      const msg = choice.message;
      messages.push(msg);

      if (choice.finish_reason === 'tool_calls' && msg.tool_calls?.length) {
        for (const call of msg.tool_calls) {
          const name = call.function.name;
          let args: Record<string, any> = {};
          try {
            args = JSON.parse(call.function.arguments || '{}');
          } catch {
            args = {};
          }

          emit({
            type: 'tool_call',
            timestamp: new Date().toISOString(),
            tool: name,
            input: args,
          });

          let result: any;
          try {
            result = await executeTool(name, args);
            if (name === 'get_github_profile') githubData = result;
            if (name === 'get_repos' && !repoData) repoData = result;
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
            tool: name,
            summary: result.error
              ? `Error: ${result.error}`
              : summarizeToolResult(name, result),
          });

          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      // finish_reason === 'stop' — parse the final JSON profile
      const text = msg.content || '';
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
