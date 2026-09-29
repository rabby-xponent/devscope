'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  JobCandidateRecord,
  JobProject,
  generateCandidateSlackBrief,
} from '@/lib/job-projects';

interface HiringCommitteeBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: JobProject;
  candidate: JobCandidateRecord;
}

export default function HiringCommitteeBriefModal({
  isOpen,
  onClose,
  project,
  candidate,
}: HiringCommitteeBriefModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySlack = () => {
    const brief = generateCandidateSlackBrief(project, candidate);
    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const stageLabels = {
    new_assessed: 'New Assessed',
    phone_screen_scheduled: 'Phone Screen Scheduled',
    interviewing: 'Interviewing',
    offer: 'Offer Stage',
    archived: 'Archived',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-edge bg-[#0e0d12] shadow-2xl overflow-hidden print:max-h-none print:w-full print:border-none print:bg-white print:text-black">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-edge/80 bg-[#121118] px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-base">
              📄
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                Engineering Manager Briefing
              </span>
              <h2 className="font-mono text-sm font-bold text-ece9f0">
                Candidate Dossier 1-Pager: @{candidate.username}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySlack}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-ece9f0 transition-colors hover:border-signal hover:text-signal"
            >
              <span>{copied ? '✓ Copied to Clipboard!' : '📋 Copy Slack Brief'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-muted transition-colors hover:text-ece9f0"
              title="Print or save as PDF"
            >
              <span>🖨️ Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge/80 bg-surface/60 font-mono text-sm text-muted hover:border-signal hover:text-signal transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Brief Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 thin-scroll space-y-6 print:p-0 print:space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-edge/80 bg-[#121118] p-5 print:border print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border border-edge bg-surface overflow-hidden flex-none flex items-center justify-center">
                {candidate.avatarUrl ? (
                  <img
                    src={candidate.avatarUrl}
                    alt={candidate.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-xl font-bold text-muted">
                    {candidate.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="font-mono text-lg font-bold text-ece9f0 print:text-black">
                  {candidate.fullName || `@${candidate.username}`}
                </h1>
                <div className="flex items-center gap-2 font-mono text-xs text-muted print:text-neutral-700">
                  <span className="text-signal font-semibold">@{candidate.username}</span>
                  <span>·</span>
                  <span className="capitalize">{candidate.persona.replace(/_/g, ' ')}</span>
                  <span>·</span>
                  <span className="capitalize text-emerald-400 font-bold">
                    {candidate.seniorityEstimate} Level
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted/70 print:text-neutral-600">
                  Target Role: <strong className="text-ece9f0 print:text-black">{project.title}</strong> ({project.department})
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-edge/60 pt-3 sm:border-0 sm:pt-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-black text-ece9f0 print:text-black">
                  {candidate.fitScore}%
                </span>
                <span className="font-mono text-[10px] uppercase font-bold text-signal">
                  Fit Match
                </span>
              </div>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  candidate.fitScore >= 85
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                }`}
              >
                {candidate.verdict.replace(/_/g, ' ')}
              </span>
              <div className="mt-1 font-mono text-xs text-muted print:text-neutral-700">
                {candidate.starRating ? '★'.repeat(candidate.starRating) : 'Not rated'} · {stageLabels[candidate.pipelineStage]}
              </div>
            </div>
          </div>

          {/* Executive Summary & Recruiter Assessment */}
          <div className="rounded-xl border border-edge/80 bg-[#121118] p-5 space-y-2 print:border print:border-neutral-300 print:bg-neutral-50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal print:text-neutral-900">
              1. Recruiter Executive Assessment
            </h3>
            <p className="font-sans text-xs leading-relaxed text-ece9f0/90 print:text-neutral-800">
              {candidate.recruiterNotes ||
                `Candidate demonstrates strong technical signals aligned with ${project.title}. Public contributions and private engineering history corroborate seniority expectations.`}
            </p>
          </div>

          {/* Core Requisition Skills Matrix */}
          <div className="rounded-xl border border-edge/80 bg-[#121118] p-5 space-y-3 print:border print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal print:text-neutral-900">
                2. Must-Have Dealbreaker Stack Verification
              </h3>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                {candidate.requirementsSummary.metCount} of {project.requisition.mustHaveSkills.length} Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {project.requisition.mustHaveSkills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2 rounded-lg border border-edge/60 bg-[#0c0b0e] p-2.5 font-mono text-xs print:border-neutral-300 print:bg-white"
                >
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="font-semibold text-ece9f0 print:text-black">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Probes for Hiring Committee */}
          <div className="rounded-xl border border-edge/80 bg-[#121118] p-5 space-y-3 print:border print:border-neutral-300 print:bg-neutral-50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal print:text-neutral-900">
              3. Recommended Technical Phone-Screen Probes
            </h3>
            <p className="font-sans text-xs text-muted print:text-neutral-600">
              Direct questions for the hiring manager or technical interviewer to validate depth and eliminate gap risks:
            </p>

            <div className="space-y-3">
              {project.guardrails.customInterviewProbes.map((probe, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-edge/60 bg-[#0c0b0e] p-3 space-y-1 print:border-neutral-300 print:bg-white"
                >
                  <div className="font-mono text-xs font-bold text-signal print:text-neutral-900">
                    Question #{i + 1}:
                  </div>
                  <p className="font-mono text-xs text-ece9f0 print:text-black leading-relaxed">
                    {probe}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Links */}
          <div className="flex items-center justify-between font-mono text-xs text-muted print:text-neutral-600">
            <span>Evaluated via DevScope RecruiterOS on {new Date(candidate.evaluatedAt).toLocaleDateString()}</span>
            <Link
              href={`/profile/${candidate.username}?jobId=${project.id}`}
              target="_blank"
              className="text-signal hover:underline print:hidden"
            >
              Open Interactive Full Audit Dossier ↗
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-edge/80 bg-[#121118] px-6 py-4 print:hidden">
          <span className="font-mono text-xs text-muted">
            Share this 1-pager directly with your Engineering Manager before the phone screen.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface px-5 py-2 font-mono text-xs font-semibold text-ece9f0 border border-edge hover:border-signal/50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
