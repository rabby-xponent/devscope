'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JobProject } from '@/lib/job-projects';
import { Icon } from '@/components/icons';

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
      <div className="flex flex-col gap-2 rounded-xl border border-edge bg-card p-3 transition-all hover:border-signal/50 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-edge bg-well text-muted">
              <Icon.Folder className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-semibold">
                  Active Job Project
                </span>
                <span className="h-1 w-1 rounded-full bg-muted/60" />
                <span className="font-mono text-[10px] text-muted truncate">
                  {activeProject ? activeProject.department : 'General'}
                </span>
              </div>
              <h3 className="font-mono text-xs font-bold text-content truncate">
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
                className="flex items-center gap-1 rounded-lg border border-edge bg-well px-2.5 py-1.5 font-mono text-[11px] font-semibold text-content transition-colors hover:border-signal/60 hover:text-signal"
                title="Open Candidate Pipeline & Comparison Leaderboard"
              >
                <Icon.Users className="h-3.5 w-3.5 text-muted" />
                <span>Pipeline ({activeProject ? activeProject.candidates.length : 0})</span>
              </button>
            )}

            {/* Guardrails Button */}
            <button
              type="button"
              onClick={onOpenGuardrails}
              className="flex items-center gap-1 rounded-lg border border-edge bg-well px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-signal/60 hover:text-signal"
              title="Configure hiring guardrails & dealbreakers for this job"
            >
              <Icon.Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guardrails</span>
            </button>

            {/* Switch Project Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              className="flex items-center gap-1 rounded-lg border border-edge bg-well px-2.5 py-1.5 font-mono text-[11px] font-medium text-content transition-colors hover:border-signal/60 hover:text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <span>Switch</span>
              <Icon.ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-signal' : 'text-muted'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Must-Have Tech & Stats Summary Bar */}
        {activeProject && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-2 font-mono text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="text-muted/80">Must-Have:</span>
              {activeProject.requisition.mustHaveSkills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-edge bg-well px-1.5 py-0.5 text-content"
                >
                  {skill}
                </span>
              ))}
              {activeProject.requisition.mustHaveSkills.length > 3 && (
                <span className="text-muted/70">
                  +{activeProject.requisition.mustHaveSkills.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted">
              {onOpenPipeline ? (
                <button
                  type="button"
                  onClick={onOpenPipeline}
                  className="inline-flex items-center gap-1 text-content font-semibold hover:text-signal cursor-pointer"
                >
                  <Icon.Users className="h-3 w-3" />
                  {activeProject.candidates.length} in pipeline
                  <Icon.ArrowUpRight className="h-3 w-3" />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-content font-semibold">
                  <Icon.Users className="h-3 w-3" />
                  {activeProject.candidates.length} evaluated
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
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-edge bg-card p-2 shadow-pop thin-scroll animate-in">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-edge">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
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
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-signal/10 text-signal border-signal/30'
                      : 'border-transparent text-content hover:bg-well'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold truncate">{proj.title}</span>
                      <span className="rounded border border-edge bg-well px-1.5 py-0.5 font-mono text-[9px] text-muted">
                        {proj.department}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Icon.Users className="h-3 w-3" />
                        {proj.candidates.length} in pipeline
                      </span>
                      <span>·</span>
                      <span className="truncate">
                        {proj.requisition.mustHaveSkills.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Icon.Check className="h-3.5 w-3.5 flex-none text-signal pl-2" />}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-edge" />

          {/* Create New Job Project Action */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenNewJobModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal/10 py-2.5 font-mono text-xs font-semibold text-signal transition-colors hover:bg-signal hover:text-[#0c0b0e]"
          >
            <Icon.Plus className="h-3.5 w-3.5" />
            <span>Create New Job Project</span>
          </button>
        </div>
      )}
    </div>
  );
}
