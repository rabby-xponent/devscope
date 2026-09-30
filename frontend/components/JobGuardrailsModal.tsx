'use client';

import React, { useState } from 'react';
import { JobProject, SeniorityTarget } from '@/lib/job-projects';
import { Icon } from '@/components/icons';
import { Select, Switch } from '@/components/ui';

interface JobGuardrailsModalProps {
  project: JobProject;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: JobProject) => void;
}

const SENIORITY_OPTIONS = [
  { value: 'junior', label: 'Junior (0-2 yrs)' },
  { value: 'mid', label: 'Mid-Level (2-5 yrs)' },
  { value: 'senior', label: 'Senior (5-8 yrs)' },
  { value: 'staff', label: 'Staff (8+ yrs)' },
  { value: 'principal', label: 'Principal (10+ yrs)' },
];

export default function JobGuardrailsModal({
  project,
  isOpen,
  onClose,
  onSave,
}: JobGuardrailsModalProps) {
  const [title, setTitle] = useState(project.title);
  const [department, setDepartment] = useState(project.department);
  const [seniorityTarget, setSeniorityTarget] = useState<SeniorityTarget>(
    project.requisition.seniorityTarget
  );
  const [minYears, setMinYears] = useState(project.requisition.minYearsExperience);
  const [allowPrivate, setAllowPrivate] = useState(project.requisition.allowPrivateRepos);
  const [minFitScore, setMinFitScore] = useState(project.guardrails.minimumFitScoreThreshold);
  const [flagAI, setFlagAI] = useState(project.guardrails.flagAIGeneratedRepos);
  const [flagTenure, setFlagTenure] = useState(project.guardrails.flagLowTenureChurn);

  // Skill tags
  const [mustHaveSkills, setMustHaveSkills] = useState<string[]>(
    project.requisition.mustHaveSkills
  );
  const [skillInput, setSkillInput] = useState('');

  // Custom probe questions
  const [probes, setProbes] = useState<string[]>(project.guardrails.customInterviewProbes);
  const [probeInput, setProbeInput] = useState('');

  if (!isOpen) return null;

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !mustHaveSkills.includes(trimmed)) {
      setMustHaveSkills([...mustHaveSkills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setMustHaveSkills(mustHaveSkills.filter((s) => s !== skill));
  };

  const handleAddProbe = () => {
    const trimmed = probeInput.trim();
    if (trimmed && !probes.includes(trimmed)) {
      setProbes([...probes, trimmed]);
      setProbeInput('');
    }
  };

  const handleRemoveProbe = (index: number) => {
    setProbes(probes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: JobProject = {
      ...project,
      title: title.trim(),
      department: department.trim(),
      requisition: {
        ...project.requisition,
        seniorityTarget,
        minYearsExperience: minYears,
        mustHaveSkills,
        allowPrivateRepos: allowPrivate,
      },
      guardrails: {
        ...project.guardrails,
        minimumFitScoreThreshold: minFitScore,
        flagAIGeneratedRepos: flagAI,
        flagLowTenureChurn: flagTenure,
        customInterviewProbes: probes,
      },
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  const inputClass =
    'mt-1 w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content outline-none transition-colors focus:border-signal focus:ring-2 focus:ring-signal/15 placeholder:text-muted/60';
  const labelClass =
    'block font-mono text-[11px] uppercase tracking-wider text-muted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-edge bg-card text-content shadow-pop overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-edge px-6 py-4 bg-well">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-card text-muted">
              <Icon.Settings className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-content">
                Hiring Guardrails & Rubric Calibration
              </h2>
              <p className="text-[11px] text-muted font-sans">
                Calibrate specific screening rules, dealbreaker skills, and interview questions for this job.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card hover:text-content"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 thin-scroll">
          {/* Job Overview */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Job Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department / Team</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Seniority & Experience Floor */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Seniority Target</label>
              <div className="mt-1">
                <Select
                  value={seniorityTarget}
                  onChange={(v) => setSeniorityTarget(v as SeniorityTarget)}
                  options={SENIORITY_OPTIONS}
                  className="w-full"
                  buttonClassName="py-2 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Min. Years Experience</label>
              <input
                type="number"
                min={0}
                max={25}
                value={minYears}
                onChange={(e) => setMinYears(Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Shortlist Fit Threshold ({minFitScore}%)</label>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={minFitScore}
                onChange={(e) => setMinFitScore(Number(e.target.value))}
                className="mt-3 w-full"
              />
            </div>
          </div>

          {/* Must-Have Skills / Dealbreaker Stack */}
          <div>
            <label className={labelClass}>
              Must-Have Technical Dealbreakers (Candidates without these get flagged)
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-xl border border-edge bg-well p-2 transition-colors focus-within:border-signal/70">
              {mustHaveSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-xs font-semibold text-signal"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-muted transition-colors hover:text-content"
                  >
                    <Icon.X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                <input
                  type="text"
                  placeholder="Type skill & press Enter…"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="w-full bg-transparent font-mono text-xs text-content outline-none placeholder:text-muted/60 px-1 py-1"
                />
                {skillInput.trim() && (
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-lg bg-signal px-2 py-0.5 font-mono text-[10px] text-[#0c0b0e] font-bold"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hiring Guardrail Toggles */}
          <div className="space-y-3 rounded-xl border border-edge bg-well p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
              Automated Screening Guardrails
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-mono text-xs font-medium text-content block">
                  Private Enterprise Repo Bias Shield (Recommended)
                </span>
                <span className="mt-0.5 text-[11px] text-muted font-sans block leading-tight">
                  Do not penalize working developers for lack of public hobby commits if enterprise employment or live demo proof exists.
                </span>
              </div>
              <Switch
                checked={allowPrivate}
                onChange={setAllowPrivate}
                ariaLabel="Private enterprise repo bias shield"
                className="mt-0.5"
              />
            </div>

            <div className="border-t border-edge" />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-mono text-xs font-medium text-content block">
                  Flag AI-Generated / Boilerplate Repositories
                </span>
                <span className="mt-0.5 text-[11px] text-muted font-sans block leading-tight">
                  Detect low-effort template clones, cookie-cutter CRUD apps, and automated repository spam.
                </span>
              </div>
              <Switch
                checked={flagAI}
                onChange={setFlagAI}
                ariaLabel="Flag AI-generated repositories"
                className="mt-0.5"
              />
            </div>
          </div>

          {/* Custom Interview Probe Questions */}
          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>
                Hiring Manager Custom Phone-Screen Probes
              </label>
              <span className="font-mono text-[10px] text-muted">{probes.length} questions</span>
            </div>

            <div className="mt-1.5 space-y-2">
              {probes.map((probe, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-xl border border-edge bg-well p-2.5 font-mono text-xs text-content"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-signal font-bold">{i + 1}.</span>
                    <span className="leading-snug">{probe}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProbe(i)}
                    aria-label="Remove probe"
                    className="text-muted transition-colors hover:text-content"
                  >
                    <Icon.X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Ask how they handle database migration rollbacks in production zero-downtime environments…"
                  value={probeInput}
                  onChange={(e) => setProbeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProbe())}
                  className={`${inputClass} mt-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddProbe}
                  className="flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2 font-mono text-xs font-semibold text-content transition-colors hover:border-signal/50 hover:text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
                >
                  <Icon.Plus className="h-3.5 w-3.5" />
                  Add Probe
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-edge pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-edge bg-card px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-signal/50 hover:text-content outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-signal px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#0c0b0e] shadow-xs transition-colors hover:bg-signal/90 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              Save Guardrails & Rubric
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
