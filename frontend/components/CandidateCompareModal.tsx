'use client';

import React from 'react';
import Link from 'next/link';
import { JobCandidateRecord, JobProject } from '@/lib/job-projects';
import { Icon } from '@/components/icons';
import { StarRating } from '@/components/ui';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-edge bg-card text-content shadow-pop overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge bg-well px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-card text-muted">
              <Icon.Scale className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                  Side-by-Side Candidate Calibration
                </span>
                <span className="h-1 w-1 rounded-full bg-muted/60" />
                <span className="font-mono text-xs text-muted truncate">{project.title}</span>
              </div>
              <h2 className="font-mono text-sm font-bold text-content">
                Comparing {candidates.length} Shortlisted Candidates
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close comparison"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-card text-muted transition-colors hover:text-content"
          >
            <Icon.X className="h-4 w-4" />
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
                  className="flex flex-col rounded-2xl border border-edge bg-well p-5 space-y-4 relative"
                >
                  {/* Rank tag */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 font-mono text-xs font-bold text-signal">
                      Rank #{idx + 1}
                    </span>
                    <StarRating value={cand.starRating || 0} size="sm" />
                  </div>

                  {/* Candidate Identity */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-14 w-14 rounded-full border border-edge bg-card flex-none overflow-hidden flex items-center justify-center">
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
                        <span className="font-mono text-lg font-bold text-muted">
                          {cand.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono text-sm font-bold text-content truncate">
                        {cand.fullName || `@${cand.username}`}
                      </h3>
                      <p className="font-mono text-xs text-signal truncate">@{cand.username}</p>
                      <span className="inline-block mt-0.5 font-mono text-[10px] text-muted capitalize">
                        {cand.persona.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Score & Verdict Banner */}
                  <div
                    className={`rounded-xl border p-3 ${
                      cand.fitScore >= 85
                        ? 'border-signal/35 bg-signal/10'
                        : 'border-edge bg-card'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-2xl font-bold text-content">
                        {cand.fitScore}%
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${
                          cand.fitScore >= 85 ? 'text-signal' : 'text-muted'
                        }`}
                      >
                        {cand.verdict.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-muted">
                      {cand.signalConfidence}% Signal Confidence
                    </div>
                  </div>

                  {/* Seniority Calibration */}
                  <div className="space-y-1.5 rounded-xl border border-edge bg-card p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                      Seniority vs Job Target ({project.requisition.seniorityTarget.toUpperCase()})
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold capitalize text-content">
                        {cand.seniorityEstimate}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                          isOverqualified
                            ? 'border-edge bg-well text-muted'
                            : isUnderqualified
                            ? 'border-edge bg-well text-muted'
                            : 'border-signal/35 bg-signal/10 text-signal'
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
                  <div className="space-y-2 rounded-xl border border-edge bg-card p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                      Must-Have Skills ({project.requisition.mustHaveSkills.length})
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 text-signal font-bold">
                        <Icon.Check className="h-3 w-3" />
                        {cand.requirementsSummary.metCount} Met
                      </span>
                      {cand.requirementsSummary.partialCount > 0 && (
                        <span className="text-muted">
                          · ~{cand.requirementsSummary.partialCount} Partial
                        </span>
                      )}
                      {cand.requirementsSummary.missingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-muted">
                          · <Icon.X className="h-3 w-3" /> {cand.requirementsSummary.missingCount} Missing
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.requisition.mustHaveSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded border border-edge bg-well px-1.5 py-0.5 font-mono text-[9px] text-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline Stage */}
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                      Current Pipeline Stage
                    </span>
                    <div className="rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content">
                      {stageLabels[cand.pipelineStage] || cand.pipelineStage}
                    </div>
                  </div>

                  {/* Recruiter Evaluation Notes */}
                  <div className="flex-1 space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                      Recruiter Notes
                    </span>
                    <p className="rounded-xl border border-edge bg-card p-2.5 font-sans text-xs text-muted leading-relaxed italic">
                      &quot;{cand.recruiterNotes || 'No notes documented for this candidate yet.'}&quot;
                    </p>
                  </div>

                  {/* Dossier Action Button */}
                  <Link
                    href={`/profile/${cand.username}?jobId=${project.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-edge bg-card py-2.5 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/60 hover:text-signal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
                  >
                    <span>Inspect Full Dossier</span>
                    <Icon.ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Key Differences / Hiring Probes Section */}
          <div className="rounded-2xl border border-edge bg-well p-5 space-y-3">
            <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-signal">
              <Icon.Lightbulb className="h-3.5 w-3.5" />
              Calibrated Technical Interview Probes for this Requisition
            </h4>
            <div className="space-y-2">
              {project.guardrails.customInterviewProbes.map((probe, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-edge bg-card p-3"
                >
                  <span className="font-mono text-xs font-bold text-signal">Q{i + 1}:</span>
                  <p className="font-mono text-xs text-content leading-relaxed">{probe}</p>
                </div>
              ))}
              {project.guardrails.customInterviewProbes.length === 0 && (
                <p className="font-mono text-[11px] text-muted">
                  No custom probes configured for this requisition yet. Add them under Guardrails.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-edge bg-well px-6 py-4">
          <div className="font-mono text-xs text-muted">
            Tip: Use dossiers to compare commit cadence, architecture patterns, and production bundles.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-edge bg-card px-5 py-2 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/60 hover:text-signal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
