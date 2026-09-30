'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons';
import { TargetRole, saveTargetRole, setActiveTargetRoleId } from '@/lib/target-roles';

interface NewTargetRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (role: TargetRole) => void;
}

export default function NewTargetRoleModal({ isOpen, onClose, onCreate }: NewTargetRoleModalProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawJdText, setRawJdText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawJdText.trim()) return;

    const role: TargetRole = {
      id: `target_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      company: company.trim() || 'Target Company',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rawJdText: rawJdText.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      status: 'researching',
      notes: '',
      auditHistory: [],
    };

    const saved = saveTargetRole(role);
    setActiveTargetRoleId(saved.id);
    onCreate(saved);

    setTitle('');
    setCompany('');
    setSourceUrl('');
    setRawJdText('');
    onClose();
  };

  const inputClass =
    'mt-1 w-full rounded-xl border border-edge bg-well px-3 py-2 font-mono text-xs text-content outline-none transition-colors focus:border-signal focus:ring-2 focus:ring-signal/15 placeholder:text-muted/60';
  const labelClass = 'block font-mono text-[11px] uppercase tracking-wider text-muted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-edge bg-card text-content p-6 shadow-pop">
        <div className="flex items-center justify-between border-b border-edge pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-well text-muted">
              <Icon.Target className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-content">
                Add Target Role
              </h2>
              <p className="text-[11px] text-muted font-sans">
                Paste the job description you&apos;re about to apply for — audits run against it.
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
              <label className={labelClass}>Role Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Job Posting URL (optional)</label>
            <input
              type="url"
              placeholder="https://jobs.example.com/role/123"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Job Description Text *</label>
            <textarea
              required
              rows={7}
              placeholder="Paste the complete job description: responsibilities, requirements, stack…"
              value={rawJdText}
              onChange={(e) => setRawJdText(e.target.value)}
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
              Add Target Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
