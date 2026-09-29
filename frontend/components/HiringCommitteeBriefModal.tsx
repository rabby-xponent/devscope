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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-[#0e0d12] text-slate-900 dark:text-[#ece9f0] shadow-2xl overflow-hidden print:max-h-none print:w-full print:border-none print:bg-white print:text-black">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-base">
              📄
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
                Engineering Manager Briefing
              </span>
              <h2 className="font-mono text-sm font-bold text-slate-900 dark:text-[#ece9f0]">
                Candidate Dossier 1-Pager: @{candidate.username}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySlack}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-edge bg-white dark:bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 dark:text-[#ece9f0] transition-colors hover:border-[#ea580c] hover:text-[#ea580c] dark:hover:border-signal dark:hover:text-signal shadow-xs"
            >
              <span>{copied ? '✓ Copied to Clipboard!' : '📋 Copy Slack Brief'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-edge bg-white dark:bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 dark:text-muted transition-colors hover:text-slate-900 dark:hover:text-[#ece9f0] shadow-xs"
              title="Print or save as PDF"
            >
              <span>🖨️ Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-edge/80 bg-white dark:bg-surface/60 font-mono text-sm text-slate-500 hover:text-slate-900 dark:text-muted dark:hover:text-signal transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Brief Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 thin-scroll space-y-6 print:p-0 print:space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] p-5 print:border print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border border-slate-200 dark:border-edge bg-white dark:bg-surface overflow-hidden flex-none flex items-center justify-center">
                {candidate.avatarUrl ? (
                  <img
                    src={candidate.avatarUrl}
                    alt={candidate.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-xl font-bold text-slate-400 dark:text-muted">
                    {candidate.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="font-mono text-lg font-bold text-slate-900 dark:text-[#ece9f0] print:text-black">
                  {candidate.fullName || `@${candidate.username}`}
                </h1>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-muted print:text-neutral-700">
                  <span className="text-[#ea580c] dark:text-signal font-semibold">@{candidate.username}</span>
                  <span>·</span>
                  <span className="capitalize">{candidate.persona.replace(/_/g, ' ')}</span>
                  <span>·</span>
                  <span className="capitalize text-emerald-700 dark:text-emerald-400 font-bold">
                    {candidate.seniorityEstimate} Level
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-muted/70 print:text-neutral-600">
                  Target Role: <strong className="text-slate-900 dark:text-[#ece9f0] print:text-black">{project.title}</strong> ({project.department})
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-slate-200 dark:border-edge/60 pt-3 sm:border-0 sm:pt-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-black text-slate-900 dark:text-[#ece9f0] print:text-black">
                  {candidate.fitScore}%
                </span>
                <span className="font-mono text-[10px] uppercase font-bold text-[#ea580c] dark:text-signal">
                  Fit Match
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  candidate.fitScore >= 85
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                }`}
              >
                {candidate.verdict.replace(/_/g, ' ')}
              </span>
              <div className="mt-1 font-mono text-xs text-slate-500 dark:text-muted print:text-neutral-700">
                {candidate.starRating ? '★'.repeat(candidate.starRating) : 'Not rated'} · {stageLabels[candidate.pipelineStage]}
              </div>
            </div>
          </div>

          {/* Executive Summary & Recruiter Assessment */}
          <div className="rounded-2xl border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] p-5 space-y-2 print:border print:border-neutral-300 print:bg-neutral-50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal print:text-neutral-900">
              1. Recruiter Executive Assessment
            </h3>
            <p className="font-sans text-xs leading-relaxed text-slate-700 dark:text-[#ece9f0]/90 print:text-neutral-800">
              {candidate.recruiterNotes ||
                `Candidate demonstrates strong technical signals aligned with ${project.title}. Public contributions and private engineering history corroborate seniority expectations.`}
            </p>
          </div>

          {/* Core Requisition Skills Matrix */}
          <div className="rounded-2xl border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] p-5 space-y-3 print:border print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal print:text-neutral-900">
                2. Must-Have Dealbreaker Stack Verification
              </h3>
              <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                {candidate.requirementsSummary.metCount} of {project.requisition.mustHaveSkills.length} Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {project.requisition.mustHaveSkills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-edge/60 bg-white dark:bg-[#0c0b0e] p-2.5 font-mono text-xs print:border-neutral-300 print:bg-white"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span className="font-semibold text-slate-800 dark:text-[#ece9f0] print:text-black">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Probes for Hiring Committee */}
          <div className="rounded-2xl border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] p-5 space-y-3 print:border print:border-neutral-300 print:bg-neutral-50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-signal print:text-neutral-900">
              3. Recommended Technical Phone-Screen Probes
            </h3>
            <p className="font-sans text-xs text-slate-500 dark:text-muted print:text-neutral-600">
              Direct questions for the hiring manager or technical interviewer to validate depth and eliminate gap risks:
            </p>

            <div className="space-y-3">
              {project.guardrails.customInterviewProbes.map((probe, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-edge/60 bg-white dark:bg-[#0c0b0e] p-3 space-y-1 print:border-neutral-300 print:bg-white"
                >
                  <div className="font-mono text-xs font-bold text-[#ea580c] dark:text-signal print:text-neutral-900">
                    Question #{i + 1}:
                  </div>
                  <p className="font-mono text-xs text-slate-800 dark:text-[#ece9f0] print:text-black leading-relaxed">
                    {probe}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Links */}
          <div className="flex items-center justify-between font-mono text-xs text-slate-500 dark:text-muted print:text-neutral-600">
            <span>Evaluated via DevScope RecruiterOS on {new Date(candidate.evaluatedAt).toLocaleDateString()}</span>
            <Link
              href={`/profile/${candidate.username}?jobId=${project.id}`}
              target="_blank"
              className="text-[#ea580c] dark:text-signal hover:underline print:hidden"
            >
              Open Interactive Full Audit Dossier ↗
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-edge/80 bg-slate-50 dark:bg-[#121118] px-6 py-4 print:hidden">
          <span className="font-mono text-xs text-slate-500 dark:text-muted">
            Share this 1-pager directly with your Engineering Manager before the phone screen.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white dark:bg-surface px-5 py-2 font-mono text-xs font-semibold text-slate-800 dark:text-[#ece9f0] border border-slate-200 dark:border-edge hover:border-[#ea580c] dark:hover:border-signal/50 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
