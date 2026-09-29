'use client';

import React, { useState } from 'react';
import { JobProject, SeniorityTarget } from '@/lib/job-projects';

interface JobGuardrailsModalProps {
  project: JobProject;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: JobProject) => void;
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-[#0e0d12] text-slate-900 dark:text-[#ece9f0] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-edge/80 px-6 py-4 bg-slate-50/50 dark:bg-[#121118]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0]">
                Hiring Guardrails & Rubric Calibration
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-muted font-sans">
                Calibrate specific screening rules, dealbreaker skills, and interview questions for this job.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 font-mono text-xs text-slate-400 hover:text-slate-700 dark:text-muted dark:hover:text-signal hover:bg-slate-100 dark:hover:bg-surface"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 thin-scroll">
          {/* Job Overview */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Job Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Department / Team
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal"
              />
            </div>
          </div>

          {/* Seniority & Experience Floor */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Seniority Target
              </label>
              <select
                value={seniorityTarget}
                onChange={(e) => setSeniorityTarget(e.target.value as SeniorityTarget)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal"
              >
                <option value="junior">Junior (0-2 yrs)</option>
                <option value="mid">Mid-Level (2-5 yrs)</option>
                <option value="senior">Senior (5-8 yrs)</option>
                <option value="staff">Staff (8+ yrs)</option>
                <option value="principal">Principal (10+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Min. Years Experience
              </label>
              <input
                type="number"
                min={0}
                max={25}
                value={minYears}
                onChange={(e) => setMinYears(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Shortlist Fit Threshold ({minFitScore}%)
              </label>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={minFitScore}
                onChange={(e) => setMinFitScore(Number(e.target.value))}
                className="mt-2 w-full accent-[#ea580c] dark:accent-signal"
              />
            </div>
          </div>

          {/* Must-Have Skills / Dealbreaker Stack */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
              Must-Have Technical Dealbreakers (Candidates without these get flagged)
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface/50 p-2">
              {mustHaveSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-signal/15 border border-orange-200 dark:border-signal/30 px-2.5 py-1 font-mono text-xs font-semibold text-[#ea580c] dark:text-signal"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-500 font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                <input
                  type="text"
                  placeholder="Type skill & press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="w-full bg-transparent font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none placeholder:text-slate-400 dark:placeholder:text-muted/40 px-1 py-1"
                />
                {skillInput.trim() && (
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-lg bg-[#ea580c] dark:bg-signal px-2 py-0.5 font-mono text-[10px] text-white dark:text-ink font-bold"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hiring Guardrail Toggles */}
          <div className="space-y-3 rounded-xl border border-slate-200 dark:border-edge/60 bg-slate-50/70 dark:bg-surface/30 p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
              Automated Screening Guardrails
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPrivate}
                onChange={(e) => setAllowPrivate(e.target.checked)}
                className="mt-0.5 rounded accent-[#ea580c] dark:accent-signal"
              />
              <div>
                <span className="font-mono text-xs font-medium text-slate-900 dark:text-[#ece9f0] block">
                  Private Enterprise Repo Bias Shield (Recommended)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-muted font-sans block leading-tight">
                  Do not penalize working developers for lack of public hobby commits if enterprise employment or live demo proof exists.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={flagAI}
                onChange={(e) => setFlagAI(e.target.checked)}
                className="mt-0.5 rounded accent-[#ea580c] dark:accent-signal"
              />
              <div>
                <span className="font-mono text-xs font-medium text-slate-900 dark:text-[#ece9f0] block">
                  Flag AI-Generated / Boilerplate Repositories
                </span>
                <span className="text-[11px] text-slate-500 dark:text-muted font-sans block leading-tight">
                  Detect low-effort template clones, cookie-cutter CRUD apps, and automated repository spam.
                </span>
              </div>
            </label>
          </div>

          {/* Custom Interview Probe Questions */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Hiring Manager Custom Phone-Screen Probes
              </label>
              <span className="font-mono text-[10px] text-slate-400 dark:text-muted">{probes.length} questions</span>
            </div>

            <div className="mt-1.5 space-y-2">
              {probes.map((probe, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 dark:border-edge/60 bg-slate-50 dark:bg-surface/40 p-2.5 font-mono text-xs text-slate-900 dark:text-[#ece9f0]"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[#ea580c] dark:text-signal font-bold">{i + 1}.</span>
                    <span className="leading-snug">{probe}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProbe(i)}
                    className="text-slate-400 hover:text-rose-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Ask how they handle database migration rollbacks in production zero-downtime environments..."
                  value={probeInput}
                  onChange={(e) => setProbeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProbe())}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal placeholder:text-slate-400 dark:placeholder:text-muted/40"
                />
                <button
                  type="button"
                  onClick={handleAddProbe}
                  className="rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-100 dark:bg-surface px-4 py-2 font-mono text-xs font-semibold text-[#ea580c] dark:text-signal hover:bg-[#ea580c] hover:text-white dark:hover:bg-signal dark:hover:text-ink transition-colors"
                >
                  ＋ Add Probe
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-edge/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-edge/80 px-4 py-2 font-mono text-xs text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-[#ece9f0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#ea580c] hover:bg-[#c2410c] dark:bg-signal dark:hover:bg-signal/90 px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white dark:text-ink shadow-sm"
            >
              Save Guardrails & Rubric
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
