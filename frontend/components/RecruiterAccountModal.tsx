'use client';

import React, { useState } from 'react';
import { RecruiterAccount, saveRecruiterAccount } from '@/lib/recruiter-auth';

interface RecruiterAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: RecruiterAccount;
  onUpdate: (updated: RecruiterAccount) => void;
}

export default function RecruiterAccountModal({
  isOpen,
  onClose,
  account,
  onUpdate,
}: RecruiterAccountModalProps) {
  const [name, setName] = useState(account.name);
  const [title, setTitle] = useState(account.title);
  const [company, setCompany] = useState(account.company);
  const [email, setEmail] = useState(account.email);
  const [department, setDepartment] = useState(account.department);
  const [defaultFit, setDefaultFit] = useState(account.preferences.defaultMinimumFit);
  const [allowPrivate, setAllowPrivate] = useState(account.preferences.allowPrivateRepos);
  const [autoShortlist, setAutoShortlist] = useState(account.preferences.autoShortlistTopMatches);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveRecruiterAccount({
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      email: email.trim(),
      department: department.trim(),
      preferences: {
        ...account.preferences,
        defaultMinimumFit: defaultFit,
        allowPrivateRepos: allowPrivate,
        autoShortlistTopMatches: autoShortlist,
      },
    });
    onUpdate(updated);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-edge bg-[#0e0d12] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge/80 bg-[#121118] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-signal/40 bg-surface flex items-center justify-center overflow-hidden">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-sm font-bold text-signal">
                  {name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                  Recruiter Identity & Workspace
                </span>
                <span className="rounded bg-signal/15 px-1.5 py-0.2 font-mono text-[9px] font-bold text-signal border border-signal/30 uppercase">
                  {account.planTier}
                </span>
              </div>
              <h2 className="font-mono text-sm font-bold text-ece9f0">
                {name || 'Recruiter Profile'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge/80 bg-surface/60 font-mono text-sm text-muted hover:border-signal hover:text-signal transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 thin-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-edge bg-[#0c0b0e] px-3.5 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-edge bg-[#0c0b0e] px-3.5 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                Job Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Technical Recruiter"
                className="w-full rounded-xl border border-edge bg-[#0c0b0e] px-3.5 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Talent Partners"
                className="w-full rounded-xl border border-edge bg-[#0c0b0e] px-3.5 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
              Team / Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering Talent Acquisition"
              className="w-full rounded-xl border border-edge bg-[#0c0b0e] px-3.5 py-2 font-mono text-xs text-ece9f0 outline-none focus:border-signal"
            />
          </div>

          {/* Hiring Guardrails Defaults */}
          <div className="pt-2 border-t border-edge/60 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-signal font-bold">
              Default Screening Guardrails
            </span>

            <div className="rounded-xl border border-edge/60 bg-[#0c0b0e] p-3 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted">Default Minimum Fit Threshold:</span>
                <span className="font-bold text-signal">{defaultFit}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={defaultFit}
                onChange={(e) => setDefaultFit(Number(e.target.value))}
                className="w-full accent-signal cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 rounded-lg border border-edge/60 bg-[#0c0b0e] p-2.5 cursor-pointer hover:border-signal/40">
                <input
                  type="checkbox"
                  checked={allowPrivate}
                  onChange={(e) => setAllowPrivate(e.target.checked)}
                  className="rounded border-edge bg-surface text-signal focus:ring-0 cursor-pointer"
                />
                <div className="font-mono text-xs">
                  <span className="text-ece9f0 font-semibold block">Private Repo Bias Shield</span>
                  <span className="text-muted text-[10px]">
                    Never penalize enterprise engineers who contribute code to private corporate orgs.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 rounded-lg border border-edge/60 bg-[#0c0b0e] p-2.5 cursor-pointer hover:border-signal/40">
                <input
                  type="checkbox"
                  checked={autoShortlist}
                  onChange={(e) => setAutoShortlist(e.target.checked)}
                  className="rounded border-edge bg-surface text-signal focus:ring-0 cursor-pointer"
                />
                <div className="font-mono text-xs">
                  <span className="text-ece9f0 font-semibold block">Auto-Shortlist Top Matches</span>
                  <span className="text-muted text-[10px]">
                    Automatically advance candidates scoring &ge; 85% to Phone Screen stage.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-edge/60">
            <span className="font-mono text-[10px] text-muted">
              Preferences are saved to your browser session.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-edge bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted hover:text-ece9f0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-signal px-4 py-1.5 font-mono text-xs font-bold text-ink hover:opacity-90 transition-opacity"
              >
                {savedToast ? '✓ Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
