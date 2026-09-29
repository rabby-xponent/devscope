'use client';

import React from 'react';
import Link from 'next/link';
import { JobCandidateRecord, JobProject } from '@/lib/job-projects';

interface CandidateCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: JobProject;
  candidates: JobCandidateRecord[];
}

export default function CandidateCompareModal({
  isOpen,
  onClose,
  project,
  candidates,
}: CandidateCompareModalProps) {
  if (!isOpen || candidates.length === 0) return null;

  const stageLabels = {
    new_assessed: 'New Assessed',
    phone_screen_scheduled: 'Phone Screen',
    interviewing: 'Interviewing',
    offer: 'Offer Stage',
    archived: 'Archived',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-[#0e0d12] text-slate-900 dark:text-[#ece9f0] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-signal/15 border border-orange-200 dark:border-signal/30 text-lg">
              ⚖️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ea580c] dark:text-signal font-bold">
                  Side-by-Side Candidate Calibration
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-muted/60" />
                <span className="font-mono text-xs text-slate-500 dark:text-muted truncate">{project.title}</span>
              </div>
              <h2 className="font-mono text-sm font-bold text-slate-900 dark:text-[#ece9f0]">
                Comparing {candidates.length} Shortlisted Candidates
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-edge/80 bg-white dark:bg-surface/60 font-mono text-sm text-slate-500 hover:text-slate-900 dark:text-muted dark:hover:text-signal transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Matrix Content */}
        <div className="flex-1 overflow-y-auto p-6 thin-scroll space-y-6">
          {/* Comparison Grid */}
          <div
            className={`grid gap-4 ${
              candidates.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {candidates.map((cand, idx) => {
              const isOverqualified =
                (cand.seniorityEstimate === 'principal' || cand.seniorityEstimate === 'staff') &&
                project.requisition.seniorityTarget === 'senior';
              const isUnderqualified =
                cand.seniorityEstimate === 'mid' &&
                (project.requisition.seniorityTarget === 'senior' || project.requisition.seniorityTarget === 'staff');

              return (
                <div
                  key={cand.id}
                  className="flex flex-col rounded-2xl border border-slate-200 dark:border-edge/80 bg-slate-50/70 dark:bg-[#121118]/80 p-5 space-y-4 relative"
                >
                  {/* Rank tag */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-orange-50 dark:bg-signal/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#ea580c] dark:text-signal border border-orange-200 dark:border-signal/20">
                      Rank #{idx + 1}
                    </span>
                    <span className="font-mono text-xs text-slate-400 dark:text-muted">
                      {cand.starRating ? '★'.repeat(cand.starRating) : 'Not rated'}
                    </span>
                  </div>

                  {/* Candidate Identity */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-14 w-14 rounded-full border border-slate-200 dark:border-edge/80 bg-white dark:bg-surface flex-none overflow-hidden flex items-center justify-center">
                      {cand.avatarUrl ? (
                        <img
                          src={cand.avatarUrl}
                          alt={cand.username}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="font-mono text-lg font-bold text-slate-400 dark:text-muted">
                          {cand.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-[#ece9f0] truncate">
                        {cand.fullName || `@${cand.username}`}
                      </h3>
                      <p className="font-mono text-xs text-[#ea580c] dark:text-signal truncate">@{cand.username}</p>
                      <span className="inline-block mt-0.5 font-mono text-[10px] text-slate-500 dark:text-muted capitalize">
                        {cand.persona.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Score & Verdict Banner */}
                  <div
                    className={`rounded-xl border p-3 ${
                      cand.fitScore >= 85
                        ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20'
                        : cand.fitScore >= 70
                        ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-2xl font-bold text-slate-900 dark:text-[#ece9f0]">
                        {cand.fitScore}%
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${
                          cand.fitScore >= 85
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : cand.fitScore >= 70
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {cand.verdict.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-slate-500 dark:text-muted">
                      {cand.signalConfidence}% Signal Confidence
                    </div>
                  </div>

                  {/* Seniority Calibration */}
                  <div className="space-y-1.5 rounded-xl border border-slate-200 dark:border-edge/60 bg-white dark:bg-[#0c0b0e] p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
                      Seniority vs Job Target ({project.requisition.seniorityTarget.toUpperCase()})
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold capitalize text-slate-900 dark:text-[#ece9f0]">
                        {cand.seniorityEstimate}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                          isOverqualified
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                            : isUnderqualified
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        }`}
                      >
                        {isOverqualified
                          ? 'Senior Anchor'
                          : isUnderqualified
                          ? 'Growth Delta'
                          : 'Target Match'}
                      </span>
                    </div>
                  </div>

                  {/* Requirements Breakdown */}
                  <div className="space-y-2 rounded-xl border border-slate-200 dark:border-edge/60 bg-white dark:bg-[#0c0b0e] p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
                      Must-Have Skills ({project.requisition.mustHaveSkills.length})
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ {cand.requirementsSummary.metCount} Met
                      </span>
                      {cand.requirementsSummary.partialCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          · ~{cand.requirementsSummary.partialCount} Partial
                        </span>
                      )}
                      {cand.requirementsSummary.missingCount > 0 && (
                        <span className="text-rose-600 dark:text-rose-400">
                          · ✕ {cand.requirementsSummary.missingCount} Missing
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.requisition.mustHaveSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-slate-100 dark:bg-surface px-1.5 py-0.5 font-mono text-[9px] text-slate-600 dark:text-muted border border-slate-200 dark:border-edge/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline Stage */}
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
                      Current Pipeline Stage
                    </span>
                    <div className="rounded-xl border border-slate-200 dark:border-edge/80 bg-white dark:bg-surface/60 px-3 py-2 font-mono text-xs text-slate-800 dark:text-[#ece9f0]">
                      {stageLabels[cand.pipelineStage] || cand.pipelineStage}
                    </div>
                  </div>

                  {/* Recruiter Evaluation Notes */}
                  <div className="flex-1 space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
                      Recruiter Notes
                    </span>
                    <p className="rounded-xl border border-slate-200 dark:border-edge/40 bg-white/80 dark:bg-[#0c0b0e]/70 p-2.5 font-sans text-xs text-slate-600 dark:text-muted leading-relaxed italic">
                      "{cand.recruiterNotes || 'No notes documented for this candidate yet.'}"
                    </p>
                  </div>

                  {/* Dossier Action Button */}
                  <Link
                    href={`/profile/${cand.username}?jobId=${project.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-edge bg-white dark:bg-surface/80 py-2.5 font-mono text-xs font-semibold text-slate-900 dark:text-[#ece9f0] transition-colors hover:border-[#ea580c] hover:text-[#ea580c] dark:hover:border-signal dark:hover:text-signal shadow-xs"
                  >
                    <span>Inspect Full Dossier</span>
                    <span>↗</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Key Differences / Hiring Probes Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] p-5 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal">
              💡 Calibrated Technical Interview Probes for this Requisition
            </h4>
            <div className="space-y-2">
              {project.guardrails.customInterviewProbes.map((probe, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-edge/50 bg-white dark:bg-[#0c0b0e] p-3"
                >
                  <span className="font-mono text-xs font-bold text-[#ea580c] dark:text-signal">Q{i + 1}:</span>
                  <p className="font-mono text-xs text-slate-800 dark:text-[#ece9f0] leading-relaxed">{probe}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] px-6 py-4">
          <div className="font-mono text-xs text-slate-500 dark:text-muted">
            Tip: Use dossiers to compare commit cadence, architecture patterns, and production bundles.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white dark:bg-surface px-5 py-2 font-mono text-xs font-semibold text-slate-800 dark:text-[#ece9f0] border border-slate-200 dark:border-edge hover:border-[#ea580c] dark:hover:border-signal/50 transition-colors shadow-xs"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
