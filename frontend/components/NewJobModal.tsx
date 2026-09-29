'use client';

import React, { useState } from 'react';
import { JobProject, SeniorityTarget } from '@/lib/job-projects';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectData: Partial<JobProject> & { title: string }) => void;
}

export default function NewJobModal({ isOpen, onClose, onCreate }: NewJobModalProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [rawJd, setRawJd] = useState('');
  const [seniorityTarget, setSeniorityTarget] = useState<SeniorityTarget>('senior');
  const [minYears, setMinYears] = useState(4);
  const [mustHaveSkills, setMustHaveSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawJd.trim()) return;

    onCreate({
      title: title.trim(),
      department: department.trim() || 'Engineering Team',
      requisition: {
        rawJdText: rawJd.trim(),
        seniorityTarget,
        minYearsExperience: minYears,
        mustHaveSkills: mustHaveSkills.length > 0 ? mustHaveSkills : ['Full-Stack', 'Engineering'],
        niceToHaveSkills: [],
        allowPrivateRepos: true,
      },
      guardrails: {
        minimumFitScoreThreshold: 70,
        flagAIGeneratedRepos: true,
        flagLowTenureChurn: true,
        customInterviewProbes: [],
      },
    });

    setTitle('');
    setDepartment('');
    setRawJd('');
    setMustHaveSkills([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 dark:border-edge bg-white dark:bg-[#0e0d12] text-slate-900 dark:text-[#ece9f0] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-edge/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-[#ece9f0]">
                Create New Job Project
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-muted font-sans">
                Set up a dedicated workspace for an open engineering requisition.
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

        <form onSubmit={handleSubmit} className="mt-4 flex-1 space-y-4 overflow-y-auto thin-scroll pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Backend Go Engineer"
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
                placeholder="e.g. Payments & Ledger"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
              Must-Have Technical Skills (Dealbreakers)
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface/50 p-2">
              {mustHaveSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-signal/15 border border-orange-200 dark:border-signal/30 px-2 py-0.5 font-mono text-xs font-semibold text-[#ea580c] dark:text-signal"
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
              <div className="flex items-center gap-1 flex-1 min-w-[140px]">
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

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-muted">
              Full Job Description / Requirements *
            </label>
            <textarea
              required
              rows={6}
              placeholder="Paste the complete job description text, requirements, and responsibilities..."
              value={rawJd}
              onChange={(e) => setRawJd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-edge/80 bg-slate-50 dark:bg-surface px-3 py-2 font-mono text-xs text-slate-900 dark:text-[#ece9f0] outline-none focus:border-[#ea580c] dark:focus:border-signal placeholder:text-slate-400 dark:placeholder:text-muted/40"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-edge/60">
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
              Create Job Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
