'use client';

import React, { useState } from 'react';
import { JobProject, SeniorityTarget } from '@/lib/job-projects';
import { Icon } from '@/components/icons';
import { Select } from '@/components/ui';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectData: Partial<JobProject> & { title: string }) => void;
}

const SENIORITY_OPTIONS = [
  { value: 'junior', label: 'Junior (0-2 yrs)' },
  { value: 'mid', label: 'Mid-Level (2-5 yrs)' },
  { value: 'senior', label: 'Senior (5-8 yrs)' },
  { value: 'staff', label: 'Staff (8+ yrs)' },
  { value: 'principal', label: 'Principal (10+ yrs)' },
];

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

  const inputClass =
    'mt-1 w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content outline-none transition-colors focus:border-signal focus:ring-2 focus:ring-signal/15 placeholder:text-muted/60';
  const labelClass =
    'block font-mono text-[11px] uppercase tracking-wider text-muted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-edge bg-card text-content p-6 shadow-pop">
        <div className="flex items-center justify-between border-b border-edge pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-well text-muted">
              <Icon.Folder className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-content">
                Create New Job Project
              </h2>
              <p className="text-[11px] text-muted font-sans">
                Set up a dedicated workspace for an open engineering requisition.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-well hover:text-content"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex-1 space-y-4 overflow-y-auto thin-scroll pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Backend Go Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Department / Team</label>
              <input
                type="text"
                placeholder="e.g. Payments & Ledger"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          <div>
            <label className={labelClass}>Must-Have Technical Skills (Dealbreakers)</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-xl border border-edge bg-well p-2 transition-colors focus-within:border-signal/70">
              {mustHaveSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-xs font-semibold text-signal"
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
              <div className="flex items-center gap-1 flex-1 min-w-[140px]">
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

          <div>
            <label className={labelClass}>Full Job Description / Requirements *</label>
            <textarea
              required
              rows={6}
              placeholder="Paste the complete job description text, requirements, and responsibilities…"
              value={rawJd}
              onChange={(e) => setRawJd(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-edge">
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
              Create Job Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
