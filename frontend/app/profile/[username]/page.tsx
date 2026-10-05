'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useDevScopeStream } from '@/hooks/useDevScopeStream';
import { AgentTrace } from '@/components/AgentTrace';
import { AgentProgress } from '@/components/AgentProgress';
import { ProfileView } from '@/components/ProfileView';
import { Icon } from '@/components/icons';
import { getRequisitionById } from '@/lib/requisitions';
import { getJobProjectById, addCandidateToProject } from '@/lib/job-projects';
import { getTargetRoleById, recordAuditForRole } from '@/lib/target-roles';
import { PublishProofBar } from '@/components/PublishProofBar';
import { DemoWall, DemoSignupBanner } from '@/components/DemoUpsell';

export default function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = String(params.username || '');
  const liveUrl = searchParams.get('liveUrl') || undefined;
  const roleId = searchParams.get('roleId') || undefined;
  const jobId = searchParams.get('jobId') || undefined;
  const targetRoleId = searchParams.get('targetRoleId') || undefined;
  const rawJd = searchParams.get('jd') || undefined;
  const mode = searchParams.get('mode') === 'developer' ? 'developer' : 'recruiter';

  let activeJd = rawJd;
  let activeTitle = searchParams.get('roleTitle') || undefined;

  // Resolve from JobProject if jobId is supplied (RecruiterOS Engine)
  if (jobId) {
    const project = getJobProjectById(jobId);
    if (project) {
      activeJd = project.requisition.rawJdText;
      activeTitle = project.title;
    }
  } else if (targetRoleId) {
    // Resolve from CareerOS target role (Developer Campaign Engine)
    const target = targetRoleId ? getTargetRoleById(targetRoleId) : undefined;
    if (target) {
      activeJd = target.rawJdText;
      activeTitle = target.title;
    }
  } else if (roleId) {
    const saved = getRequisitionById(roleId);
    if (saved) {
      activeJd = saved.rawJdText;
      activeTitle = saved.title;
    }
  }

  const { status, trace, profile, cached, error, generate, reset } = useDevScopeStream();

  useEffect(() => {
    if (username) generate(username, false, liveUrl, activeJd, activeTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, liveUrl, roleId, jobId, rawJd, targetRoleId]);

  // Auto-record assessed candidate into Job Project pipeline upon completion
  useEffect(() => {
    if (status === 'complete' && profile && jobId) {
      const fit = profile.requisitionFit;
      try {
        addCandidateToProject(jobId, {
          username: profile.username,
          fullName: profile.github.name || profile.username,
          avatarUrl: profile.github.avatarUrl,
          liveUrl: profile.liveAppAudit?.url || liveUrl,
          fitScore: fit?.matchScore || 75,
          verdict: fit?.verdict || 'strong_match',
          seniorityEstimate: (profile.recruiterPanel?.seniorityEstimate as any) || 'senior',
          persona: profile.recruiterPanel?.developerPersona || 'working_professional',
          signalConfidence: 94,
          requirementsSummary: {
            metCount: fit?.requirements.filter((r) => r.status === 'met').length || 0,
            partialCount: fit?.requirements.filter((r) => r.status === 'partially_met').length || 0,
            missingCount: fit?.requirements.filter((r) => r.status === 'gap_probe').length || 0,
          },
          recruiterNotes: profile.headline || 'Automated screening assessment',
          pipelineStage: 'new_assessed',
        });
      } catch {
        /* ignore */
      }
    }
  }, [status, profile, jobId, liveUrl]);

  // Auto-record developer pre-flight audit into the CareerOS target role ledger
  useEffect(() => {
    if (status === 'complete' && profile && targetRoleId) {
      try {
        recordAuditForRole(targetRoleId, profile);
      } catch {
        /* ignore */
      }
    }
  }, [status, profile, targetRoleId]);

  const isWorking = status === 'connecting' || status === 'streaming';

  return (
    <main className="page-texture min-h-screen bg-canvas text-content">
      <nav className="sticky top-0 z-10 border-b border-edge bg-card/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:text-signal"
          >
            <span className="h-2 w-2 rounded-full bg-signal" />
            devscope
          </Link>
          <div className="flex items-center gap-5">
            {status === 'complete' && (
              <button
                onClick={() => generate(username, true, liveUrl, activeJd, activeTitle)}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-signal"
              >
                <Icon.Refresh className="h-3 w-3" />
                regenerate
              </button>
            )}
            <Link
              href="/"
              className="rounded-md border border-edge bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
            >
              + analyze another
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:p-0">        {error &&
          (error.code === 'demo_exhausted' ||
            error.code === 'rate_limited' ||
            error.code === 'quota_exhausted') && (
          <DemoWall code={error.code} username={username} message={error.message} />
        )}
        {error &&
          error.code !== 'demo_exhausted' &&
          error.code !== 'rate_limited' &&
          error.code !== 'quota_exhausted' && (
          <div className="fade-up mx-auto max-w-xl rounded-xl border border-edge/80 bg-surface/90 p-8 text-center shadow-2xl print:hidden">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-edge bg-well text-muted">
            <Icon.Alert className="h-5 w-5" />
          </div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-signal">
              Analysis Temporarily Paused
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ece9f0/90">
              {error.message}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => generate(username, true, liveUrl, activeJd, activeTitle)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#0c0b0e] shadow-xs transition-all hover:bg-signal/90 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <Icon.Refresh className="h-3 w-3" />
                Retry Analysis
              </button>
              <Link
                href="/"
                className="rounded-lg border border-edge bg-surface/60 px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-muted transition-all hover:border-signal/50 hover:text-ece9f0"
              >
                ← Analyze Another Candidate
              </Link>
            </div>
            {error.technicalDetails && (
              <details className="mt-6 text-left border-t border-edge/60 pt-4">
                <summary className="cursor-pointer font-mono text-[11px] text-muted hover:text-signal">
                  Technical Diagnostics (Admin / Developer)
                </summary>
                <div className="mt-2 max-h-36 overflow-y-auto rounded bg-ink/70 p-3 font-mono text-[11px] leading-relaxed text-zinc-400 border border-edge/40 break-all select-all">
                  {error.technicalDetails}
                </div>
              </details>
            )}
          </div>
        )}

        {!error && isWorking && <AgentProgress username={username} trace={trace} />}

        {!error && status === 'complete' && profile && (
          <>
            {!cached && <DemoSignupBanner username={username} />}
            {cached && (
              <div className="fade-up mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-edge bg-surface/60 px-4 py-3 print:hidden">
                <p className="font-mono text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1 text-signal"><Icon.Zap className="h-3 w-3" /> instant result —</span> this profile was analyzed
                  before, so we served it from cache instead of running the agent again.
                </p>
                <button
                  onClick={() => generate(username, true, liveUrl, activeJd, activeTitle)}
                  className="flex-none rounded-md border border-edge bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-signal/50 hover:text-signal"
                >
                  run a fresh analysis
                </button>
              </div>
            )}
            {mode === 'developer' && targetRoleId && (
              <PublishProofBar username={username} targetRoleId={targetRoleId} profile={profile} />
            )}
            <ProfileView profile={profile} mode={mode} />
            {trace.length > 0 && (
              <details className="mt-10 border-t border-edge pt-6 print:hidden">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-muted hover:text-signal">
                  view agent trace ({trace.filter((t) => t.type === 'tool_call').length} tool calls)
                </summary>
                <div className="mt-4 max-w-md">
                  <AgentTrace trace={trace} active={false} />
                </div>
              </details>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-edge py-6 text-center print:hidden">
        <p className="font-mono text-[11px] text-muted/60">
          developed by{' '}
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="text-muted transition-colors hover:text-signal"
          >
            Golam Rabby
          </a>
        </p>
      </footer>
    </main>
  );
}
