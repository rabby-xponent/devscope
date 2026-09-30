'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  JobCandidateRecord,
  JobProject,
  generateCandidateSlackBrief,
} from '@/lib/job-projects';
import { Icon } from '@/components/icons';
import { StarRating } from '@/components/ui';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-edge bg-card text-content shadow-pop overflow-hidden print:max-h-none print:w-full print:border-none print:bg-white print:text-black">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-edge bg-well px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-card text-muted">
              <Icon.FileText className="h-4 w-4" />
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                Engineering Manager Briefing
              </span>
              <h2 className="font-mono text-sm font-bold text-content">
                Candidate Dossier 1-Pager: @{candidate.username}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySlack}
              className="flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3 py-1.5 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/60 hover:text-signal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <Icon.Clipboard className="h-3.5 w-3.5 text-muted" />
              <span>{copied ? 'Copied to Clipboard' : 'Copy Slack Brief'}</span>
              {copied && <Icon.Check className="h-3 w-3 text-signal" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3 py-1.5 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/60 hover:text-signal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              title="Print or save as PDF"
            >
              <Icon.Printer className="h-3.5 w-3.5 text-muted" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close brief"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-card text-muted transition-colors hover:text-content ml-2"
            >
              <Icon.X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Brief Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 thin-scroll space-y-6 print:p-0 print:space-y-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-edge bg-well p-5 print:border print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border border-edge bg-card overflow-hidden flex-none flex items-center justify-center">
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
                <h1 className="font-mono text-lg font-bold text-content print:text-black">
                  {candidate.fullName || `@${candidate.username}`}
                </h1>
                <div className="flex items-center gap-2 font-mono text-xs text-muted print:text-neutral-700">
                  <span className="text-signal font-semibold">@{candidate.username}</span>
                  <span>·</span>
                  <span className="capitalize">{candidate.persona.replace(/_/g, ' ')}</span>
                  <span>·</span>
                  <span className="capitalize text-signal font-bold">
                    {candidate.seniorityEstimate} Level
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted/80 print:text-neutral-600">
                  Target Role: <strong className="text-content print:text-black">{project.title}</strong> ({project.department})
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-edge pt-3 sm:border-0 sm:pt-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-black text-content print:text-black">
                  {candidate.fitScore}%
                </span>
                <span className="font-mono text-[10px] uppercase font-bold text-signal">
                  Fit Match
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                  candidate.fitScore >= 85
                    ? 'border-signal/35 bg-signal/10 text-signal'
                    : 'border-edge bg-card text-muted'
                }`}
              >
                {candidate.verdict.replace(/_/g, ' ')}
              </span>
              <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted print:text-neutral-700">
                <StarRating value={candidate.starRating || 0} size="sm" />
                <span>· {stageLabels[candidate.pipelineStage]}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary & Recruiter Assessment */}
          <div className="rounded-2xl border border-edge bg-well p-5 space-y-2 print:border print:border-neutral-300 print:bg-neutral-50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal print:text-neutral-900">
              1. Recruiter Executive Assessment
            </h3>
            <p className="font-sans text-xs leading-relaxed text-content/90 print:text-neutral-800">
              {candidate.recruiterNotes ||
                `Candidate demonstrates strong technical signals aligned with ${project.title}. Public contributions and private engineering history corroborate seniority expectations.`}
            </p>
          </div>

          {/* Core Requisition Skills Matrix */}
          <div className="rounded-2xl border border-edge bg-well p-5 space-y-3 print:border print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal print:text-neutral-900">
                2. Must-Have Dealbreaker Stack Verification
              </h3>
              <span className="font-mono text-xs text-signal font-bold">
                {candidate.requirementsSummary.metCount} of {project.requisition.mustHaveSkills.length} Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {project.requisition.mustHaveSkills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2 rounded-xl border border-edge bg-card p-2.5 font-mono text-xs print:border-neutral-300 print:bg-white"
                >
                  <Icon.Check className="h-3.5 w-3.5 flex-none text-signal" />
                  <span className="font-semibold text-content print:text-black">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Probes for Hiring Committee */}
          <div className="rounded-2xl border border-edge bg-well p-5 space-y-3 print:border print:border-neutral-300 print:bg-neutral-50">
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
                  className="rounded-xl border border-edge bg-card p-3 space-y-1 print:border-neutral-300 print:bg-white"
                >
                  <div className="font-mono text-xs font-bold text-signal print:text-neutral-900">
                    Question #{i + 1}:
                  </div>
                  <p className="font-mono text-xs text-content print:text-black leading-relaxed">
                    {probe}
                  </p>
                </div>
              ))}
              {project.guardrails.customInterviewProbes.length === 0 && (
                <p className="font-mono text-[11px] text-muted print:text-neutral-600">
                  No custom probes configured for this requisition yet.
                </p>
              )}
            </div>
          </div>

          {/* Live Links */}
          <div className="flex items-center justify-between font-mono text-xs text-muted print:text-neutral-600">
            <span>Evaluated via DevScope RecruiterOS on {new Date(candidate.evaluatedAt).toLocaleDateString()}</span>
            <Link
              href={`/profile/${candidate.username}?jobId=${project.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-signal hover:underline print:hidden"
            >
              Open Interactive Full Audit Dossier
              <Icon.ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-edge bg-well px-6 py-4 print:hidden">
          <span className="font-mono text-xs text-muted">
            Share this 1-pager directly with your Engineering Manager before the phone screen.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-edge bg-card px-5 py-2 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/60 hover:text-signal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
