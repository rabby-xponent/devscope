'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JobProject } from '@/lib/job-projects';

interface JobProjectBarProps {
  projects: JobProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenGuardrails: () => void;
  onOpenNewJobModal: () => void;
  onOpenPipeline?: () => void;
}

export default function JobProjectBar({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenGuardrails,
  onOpenNewJobModal,
  onOpenPipeline,
}: JobProjectBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Active Project Card / Trigger */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-edge/80 bg-white dark:bg-[#09080b] p-3 transition-all hover:border-[#ea580c]/50 dark:hover:border-signal/50 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-orange-50 dark:bg-signal/15 border border-orange-200 dark:border-signal/30 text-sm">
              📁
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ea580c] dark:text-signal font-semibold">
                  Active Job Project
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-muted/60" />
                <span className="font-mono text-[10px] text-slate-500 dark:text-muted truncate">
                  {activeProject ? activeProject.department : 'General'}
                </span>
              </div>
              <h3 className="font-mono text-xs font-bold text-slate-900 dark:text-[#ece9f0] truncate">
                {activeProject ? activeProject.title : 'Select a Job Project'}
              </h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-none">
            {/* Pipeline Leaderboard Button */}
            {onOpenPipeline && (
              <button
                type="button"
                onClick={onOpenPipeline}
                className="flex items-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                title="Open Candidate Pipeline & Comparison Leaderboard"
              >
                <span>👥</span>
                <span>Pipeline ({activeProject ? activeProject.candidates.length : 0})</span>
              </button>
            )}

            {/* Guardrails Button */}
            <button
              type="button"
              onClick={onOpenGuardrails}
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-surface/60 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 dark:text-muted hover:border-[#ea580c]/60 hover:text-[#ea580c] dark:hover:border-signal/60 dark:hover:text-signal transition-colors"
              title="Configure hiring guardrails & dealbreakers for this job"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Guardrails</span>
            </button>

            {/* Switch Project Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-edge/80 bg-slate-50 dark:bg-surface/80 px-2.5 py-1.5 font-mono text-[11px] font-medium text-slate-700 dark:text-[#ece9f0] hover:border-[#ea580c] hover:text-[#ea580c] dark:hover:border-signal dark:hover:text-signal transition-colors"
            >
              <span>Switch</span>
              <span
                className={`text-[10px] transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#ea580c] dark:text-signal' : 'text-slate-400 dark:text-muted'
                }`}
              >
                ▾
              </span>
            </button>
          </div>
        </div>

        {/* Must-Have Tech & Stats Summary Bar */}
        {activeProject && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-edge/40 pt-2 font-mono text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="text-slate-400 dark:text-muted/70">Must-Have:</span>
              {activeProject.requisition.mustHaveSkills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-slate-100 dark:bg-surface px-1.5 py-0.5 text-slate-700 dark:text-[#ece9f0] border border-slate-200 dark:border-edge/60"
                >
                  {skill}
                </span>
              ))}
              {activeProject.requisition.mustHaveSkills.length > 3 && (
                <span className="text-slate-400 dark:text-muted/60">
                  +{activeProject.requisition.mustHaveSkills.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-500 dark:text-muted">
              {onOpenPipeline ? (
                <button
                  type="button"
                  onClick={onOpenPipeline}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  👥 {activeProject.candidates.length} in pipeline ↗
                </button>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  👥 {activeProject.candidates.length} evaluated
                </span>
              )}
              <span>·</span>
              <span>Min {activeProject.guardrails.minimumFitScoreThreshold}% fit</span>
            </div>
          </div>
        )}
      </div>

      {/* Projects Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-edge bg-white dark:bg-[#121116] p-2 shadow-2xl backdrop-blur-xl thin-scroll">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-edge/40">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
              Your Open Job Projects ({projects.length})
            </span>
          </div>

          <div className="mt-1 space-y-1">
            {projects.map((proj) => {
              const isSelected = proj.id === activeProjectId;
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => {
                    onSelectProject(proj.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-signal/15 text-[#ea580c] dark:text-signal border border-orange-200 dark:border-signal/30'
                      : 'hover:bg-slate-50 dark:hover:bg-surface/80 text-slate-900 dark:text-[#ece9f0]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold truncate">{proj.title}</span>
                      <span className="rounded bg-slate-100 dark:bg-[#0c0b0e] px-1.5 py-0.2 font-mono text-[9px] text-slate-500 dark:text-muted border border-slate-200 dark:border-edge/50">
                        {proj.department}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-muted">
                      <span>👥 {proj.candidates.length} in pipeline</span>
                      <span>·</span>
                      <span className="truncate">
                        {proj.requisition.mustHaveSkills.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  </div>

                  {isSelected && <span className="text-[#ea580c] dark:text-signal text-sm pl-2">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-slate-100 dark:border-edge/40" />

          {/* Create New Job Project Action */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenNewJobModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-50 dark:bg-surface/60 py-2.5 font-mono text-xs font-semibold text-[#ea580c] dark:text-signal transition-colors hover:bg-[#ea580c] hover:text-white dark:hover:bg-signal dark:hover:text-ink"
          >
            <span>＋</span>
            <span>Create New Job Project</span>
          </button>
        </div>
      )}
    </div>
  );
}
