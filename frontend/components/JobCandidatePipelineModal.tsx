'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  JobProject,
  JobCandidateRecord,
  PipelineStage,
  updateCandidateInProject,
  removeCandidateFromProject,
  batchUpdateCandidatesStage,
  exportPipelineToMarkdown,
} from '@/lib/job-projects';
import CandidateCompareModal from './CandidateCompareModal';
import HiringCommitteeBriefModal from './HiringCommitteeBriefModal';

interface JobCandidatePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: JobProject;
  projects: JobProject[];
  onSelectProject: (projectId: string) => void;
  onOpenGuardrails: () => void;
  onRefreshProjects: () => void;
  onScreenCandidate: (username: string) => void;
}

export default function JobCandidatePipelineModal({
  isOpen,
  onClose,
  project,
  projects,
  onSelectProject,
  onOpenGuardrails,
  onRefreshProjects,
  onScreenCandidate,
}: JobCandidatePipelineModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'fit_desc' | 'fit_asc' | 'rating_desc' | 'date_desc'>('fit_desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);

  // Quick candidate screen input
  const [quickHandle, setQuickHandle] = useState('');

  // Modals
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [briefCandidate, setBriefCandidate] = useState<JobCandidateRecord | null>(null);

  if (!isOpen) return null;

  const stageOptions: { value: PipelineStage; label: string; color: string }[] = [
    { value: 'new_assessed', label: 'New Assessed', color: 'text-blue-400 bg-blue-950/40 border-blue-500/30' },
    { value: 'phone_screen_scheduled', label: 'Phone Screen', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' },
    { value: 'interviewing', label: 'Interviewing', color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' },
    { value: 'offer', label: 'Offer Stage', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' },
    { value: 'archived', label: 'Archived', color: 'text-muted bg-surface/60 border-edge/60' },
  ];

  // Filter & Sort
  const filteredCandidates = useMemo(() => {
    let list = [...project.candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          (c.fullName && c.fullName.toLowerCase().includes(q)) ||
          (c.recruiterNotes && c.recruiterNotes.toLowerCase().includes(q))
      );
    }

    if (selectedStage !== 'all') {
      list = list.filter((c) => c.pipelineStage === selectedStage);
    }

    list.sort((a, b) => {
      if (sortBy === 'fit_desc') return b.fitScore - a.fitScore;
      if (sortBy === 'fit_asc') return a.fitScore - b.fitScore;
      if (sortBy === 'rating_desc') return (b.starRating || 0) - (a.starRating || 0);
      if (sortBy === 'date_desc')
        return new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime();
      return 0;
    });

    return list;
  }, [project.candidates, searchQuery, selectedStage, sortBy]);

  // Stats calculation
  const totalCount = project.candidates.length;
  const avgFit = totalCount > 0 ? Math.round(project.candidates.reduce((sum, c) => sum + c.fitScore, 0) / totalCount) : 0;
  const shortlistedCount = project.candidates.filter(
    (c) => c.pipelineStage === 'phone_screen_scheduled' || c.pipelineStage === 'interviewing' || c.pipelineStage === 'offer'
  ).length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  const handleStageChange = (candId: string, stage: PipelineStage) => {
    updateCandidateInProject(project.id, candId, { pipelineStage: stage });
    onRefreshProjects();
  };

  const handleRatingChange = (candId: string, rating: number) => {
    updateCandidateInProject(project.id, candId, { starRating: rating });
    onRefreshProjects();
  };

  const handleSaveNote = (candId: string) => {
    updateCandidateInProject(project.id, candId, { recruiterNotes: editingNoteValue.trim() });
    setEditingNoteId(null);
    onRefreshProjects();
  };

  const handleRemove = (candId: string, username: string) => {
    if (confirm(`Remove @${username} from ${project.title} pipeline?`)) {
      removeCandidateFromProject(project.id, candId);
      setSelectedIds((prev) => prev.filter((i) => i !== candId));
      onRefreshProjects();
    }
  };

  const handleBatchStageChange = (stage: PipelineStage) => {
    if (selectedIds.length === 0) return;
    batchUpdateCandidatesStage(project.id, selectedIds, stage);
    setSelectedIds([]);
    onRefreshProjects();
  };

  const handleExportMarkdown = () => {
    const md = exportPipelineToMarkdown(project);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  const handleQuickScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHandle.trim()) return;
    const clean = quickHandle.trim().replace(/^@/, '');
    onScreenCandidate(clean);
    setQuickHandle('');
  };

  const compareCandidates = project.candidates.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[94vh] w-full max-w-7xl flex-col rounded-2xl border border-edge bg-[#0e0d12] shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge/80 bg-[#121118] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 border border-signal/30 text-xl">
              👥
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                  RecruiterOS Candidate Pipeline
                </span>
                <span className="h-1 w-1 rounded-full bg-muted/60" />
                <span className="font-mono text-xs text-muted">{project.department}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Project Switcher Select */}
                <select
                  value={project.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="bg-transparent font-mono text-base font-bold text-ece9f0 border-none outline-none cursor-pointer hover:text-signal transition-colors"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#121118] text-ece9f0 font-mono text-xs">
                      {p.title} ({p.candidates.length} candidates)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-ece9f0 transition-colors hover:border-signal hover:text-signal"
              title="Copy markdown table of this pipeline to clipboard"
            >
              <span>{copiedMd ? '✓ Copied Markdown!' : '📋 Export Leaderboard'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenGuardrails}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-muted transition-colors hover:border-signal/50 hover:text-ece9f0"
            >
              <span>⚙️</span>
              <span>Guardrails</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge/80 bg-surface/60 font-mono text-sm text-muted hover:border-signal hover:text-signal transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Requisition Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 bg-[#09080b] px-6 py-2.5 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted/70">Must-Have Stack:</span>
              {project.requisition.mustHaveSkills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-surface px-2 py-0.5 text-ece9f0 border border-edge/60 text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
            <span className="text-edge">|</span>
            <span className="text-muted">Target: <strong className="text-ece9f0 uppercase">{project.requisition.seniorityTarget}</strong></span>
          </div>

          <div className="flex items-center gap-4 text-muted text-[11px]">
            <span>Total Evaluated: <strong className="text-ece9f0">{totalCount}</strong></span>
            <span>Shortlisted: <strong className="text-emerald-400">{shortlistedCount}</strong></span>
            <span>Avg Match: <strong className="text-signal">{avgFit}%</strong></span>
          </div>
        </div>

        {/* Toolbar: Search, Stage Filter Pills, Sort & Quick Screen */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-edge/60 bg-[#121118]/60 px-6 py-3">
          {/* Stage Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedStage === 'all'
                  ? 'bg-signal text-ink font-bold shadow'
                  : 'bg-surface/60 text-muted hover:text-ece9f0'
              }`}
            >
              All ({totalCount})
            </button>
            {stageOptions.map((st) => {
              const count = project.candidates.filter((c) => c.pipelineStage === st.value).length;
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setSelectedStage(st.value)}
                  className={`rounded-lg px-2.5 py-1 transition-colors ${
                    selectedStage === st.value
                      ? 'bg-signal text-ink font-bold shadow'
                      : 'bg-surface/60 text-muted hover:text-ece9f0'
                  }`}
                >
                  {st.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center gap-1.5 rounded-lg border border-edge/80 bg-[#0c0b0e] px-2.5 py-1 text-xs">
              <span className="text-muted">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate..."
                className="w-32 sm:w-40 bg-transparent font-mono text-xs text-ece9f0 outline-none placeholder:text-muted/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-muted hover:text-signal text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-edge/80 bg-surface/80 px-2.5 py-1 font-mono text-xs text-muted outline-none hover:text-ece9f0 cursor-pointer"
            >
              <option value="fit_desc">Fit Score: High → Low</option>
              <option value="fit_asc">Fit Score: Low → High</option>
              <option value="rating_desc">Rating: Highest First</option>
              <option value="date_desc">Evaluated: Newest First</option>
            </select>
          </div>
        </div>

        {/* Candidate Table Area */}
        <div className="flex-1 overflow-y-auto thin-scroll p-6">
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-edge text-2xl">
                📂
              </span>
              <div>
                <h4 className="font-mono text-sm font-bold text-ece9f0">
                  No candidates match current criteria
                </h4>
                <p className="mt-1 font-sans text-xs text-muted max-w-sm">
                  {searchQuery || selectedStage !== 'all'
                    ? 'Try clearing filters or search terms to view all evaluated candidates.'
                    : `No candidates assessed against ${project.title} yet. Add a candidate below to audit their fit.`}
                </p>
              </div>

              {/* Quick Screen Input */}
              <form
                onSubmit={handleQuickScreen}
                className="flex items-center gap-2 max-w-sm w-full pt-2"
              >
                <div className="flex items-center gap-1.5 flex-1 rounded-xl border border-edge/80 bg-[#0c0b0e] px-3 py-2">
                  <span className="font-mono text-xs text-signal font-bold">@</span>
                  <input
                    type="text"
                    value={quickHandle}
                    onChange={(e) => setQuickHandle(e.target.value)}
                    placeholder="github-username"
                    className="w-full bg-transparent font-mono text-xs text-ece9f0 outline-none placeholder:text-muted/40"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-signal px-4 py-2 font-mono text-xs font-bold text-ink hover:opacity-90 transition-opacity"
                >
                  Screen
                </button>
              </form>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-edge/60 text-left font-mono text-[10px] uppercase tracking-wider text-muted/70">
                    <th className="py-2.5 pl-3 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredCandidates.length > 0 &&
                          selectedIds.length === filteredCandidates.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-edge bg-surface text-signal focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-2 w-12 text-center">Rank</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Candidate</th>
                    <th className="py-2.5 px-3 text-center min-w-[110px]">Fit Score</th>
                    <th className="py-2.5 px-3 text-center min-w-[130px]">Seniority</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Stack Check</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Pipeline Stage</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Rating</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Recruiter Notes</th>
                    <th className="py-2.5 pr-3 pl-2 text-right min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge/40">
                  {filteredCandidates.map((cand, idx) => {
                    const isSelected = selectedIds.includes(cand.id);
                    const isTop3 = idx < 3;
                    const rankBadgeColor =
                      idx === 0
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                        : idx === 1
                        ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                        : idx === 2
                        ? 'bg-amber-700/20 text-amber-500 border-amber-600/40'
                        : 'bg-surface text-muted border-edge/60';

                    return (
                      <tr
                        key={cand.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-signal/10 border-l-2 border-l-signal'
                            : 'hover:bg-surface/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 pl-3 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(cand.id)}
                            className="rounded border-edge bg-surface text-signal focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Rank */}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border ${rankBadgeColor}`}
                          >
                            #{idx + 1}
                          </span>
                        </td>

                        {/* Candidate Identity */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full border border-edge bg-surface overflow-hidden flex-none flex items-center justify-center">
                              {cand.avatarUrl ? (
                                <img
                                  src={cand.avatarUrl}
                                  alt={cand.username}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="font-mono text-xs font-bold text-muted">
                                  {cand.username.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/profile/${cand.username}?jobId=${project.id}`}
                                target="_blank"
                                className="font-mono text-xs font-bold text-ece9f0 hover:text-signal transition-colors block truncate"
                              >
                                {cand.fullName || `@${cand.username}`}
                              </Link>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                                <span className="text-signal">@{cand.username}</span>
                                <span>·</span>
                                <span className="capitalize">{cand.persona.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Fit Score */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold ${
                                cand.fitScore >= 85
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                                  : cand.fitScore >= 70
                                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {cand.fitScore}%
                            </span>
                            <span className="mt-0.5 text-[9px] text-muted capitalize truncate max-w-[100px]">
                              {cand.verdict.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>

                        {/* Seniority */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="capitalize font-semibold text-ece9f0">
                              {cand.seniorityEstimate}
                            </span>
                            <span className="text-[9px] text-muted">
                              Target: {project.requisition.seniorityTarget}
                            </span>
                          </div>
                        </td>

                        {/* Stack Check */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-emerald-400 font-bold">
                                ✓ {cand.requirementsSummary.metCount} Met
                              </span>
                              {cand.requirementsSummary.missingCount > 0 && (
                                <span className="text-rose-400">
                                  ✕ {cand.requirementsSummary.missingCount}
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-muted truncate max-w-[130px]">
                              {project.requisition.mustHaveSkills.slice(0, 3).join(', ')}
                            </div>
                          </div>
                        </td>

                        {/* Pipeline Stage Select */}
                        <td className="py-3 px-3">
                          <select
                            value={cand.pipelineStage}
                            onChange={(e) =>
                              handleStageChange(cand.id, e.target.value as PipelineStage)
                            }
                            className="w-full rounded-lg border border-edge/80 bg-[#0c0b0e] px-2 py-1 font-mono text-[11px] text-ece9f0 outline-none hover:border-signal/50 cursor-pointer"
                          >
                            {stageOptions.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Rating (1-5 Stars) */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  handleRatingChange(
                                    cand.id,
                                    cand.starRating === star ? 0 : star
                                  )
                                }
                                className={`text-sm transition-transform hover:scale-125 ${
                                  cand.starRating && cand.starRating >= star
                                    ? 'text-amber-400'
                                    : 'text-muted/30 hover:text-amber-400/50'
                                }`}
                                title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Inline Recruiter Note */}
                        <td className="py-3 px-3">
                          {editingNoteId === cand.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingNoteValue}
                                onChange={(e) => setEditingNoteValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveNote(cand.id);
                                  if (e.key === 'Escape') setEditingNoteId(null);
                                }}
                                autoFocus
                                className="w-full rounded border border-signal bg-[#0c0b0e] px-2 py-1 font-mono text-xs text-ece9f0 outline-none"
                              />
                              <button
                                onClick={() => handleSaveNote(cand.id)}
                                className="rounded bg-signal px-2 py-1 text-[10px] font-bold text-ink"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNoteId(cand.id);
                                setEditingNoteValue(cand.recruiterNotes || '');
                              }}
                              className="group flex items-center justify-between gap-1 rounded p-1 hover:bg-surface/60 cursor-pointer"
                              title="Click to edit recruiter notes"
                            >
                              <span className="truncate text-muted text-[11px] italic font-sans max-w-[190px]">
                                {cand.recruiterNotes || '+ Add note...'}
                              </span>
                              <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                ✏️
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 pr-3 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setBriefCandidate(cand)}
                              className="rounded border border-edge/80 bg-surface/60 px-2 py-1 font-mono text-[10px] font-medium text-ece9f0 hover:border-signal hover:text-signal transition-colors"
                              title="View and print 1-pager brief for hiring committee"
                            >
                              EM Brief
                            </button>

                            <Link
                              href={`/profile/${cand.username}?jobId=${project.id}`}
                              target="_blank"
                              className="rounded border border-edge/80 bg-surface/60 px-2 py-1 font-mono text-[10px] font-medium text-muted hover:border-signal hover:text-signal transition-colors"
                              title="Open full interactive DevScope audit dossier"
                            >
                              ↗
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleRemove(cand.id, cand.username)}
                              className="rounded border border-edge/80 bg-surface/40 px-1.5 py-1 font-mono text-[10px] text-muted hover:border-rose-500/50 hover:text-rose-400 transition-colors"
                              title="Remove candidate from this job"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Floating Multi-Select Action Bar */}
        {selectedIds.length > 0 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-signal/40 bg-[#121118]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
            <span className="font-mono text-xs font-bold text-signal">
              {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
            </span>

            <span className="h-4 w-[1px] bg-edge" />

            {/* Compare Side-by-Side (enabled when 2 or 3 selected) */}
            <button
              type="button"
              disabled={selectedIds.length < 2 || selectedIds.length > 3}
              onClick={() => setCompareModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                selectedIds.length >= 2 && selectedIds.length <= 3
                  ? 'bg-signal text-ink hover:opacity-90 shadow-lg'
                  : 'bg-surface/80 text-muted/60 cursor-not-allowed border border-edge/40'
              }`}
              title={
                selectedIds.length < 2
                  ? 'Select 2 or 3 candidates to compare side-by-side'
                  : selectedIds.length > 3
                  ? 'Select at most 3 candidates to compare'
                  : 'Compare selected candidates side-by-side'
              }
            >
              <span>⚖️</span>
              <span>Compare Side-by-Side</span>
            </button>

            {/* Batch Change Stage */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBatchStageChange(e.target.value as PipelineStage);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="rounded-lg border border-edge bg-surface px-2.5 py-1.5 font-mono text-xs text-ece9f0 outline-none hover:border-signal cursor-pointer"
            >
              <option value="" disabled>
                Move To Stage...
              </option>
              {stageOptions.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="font-mono text-xs text-muted hover:text-ece9f0 pl-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-edge/80 bg-[#121118] px-6 py-3 font-mono text-xs text-muted">
          <div className="flex items-center gap-3">
            <span>Showing {filteredCandidates.length} of {project.candidates.length} candidates</span>
            <span>·</span>
            <span>Select 2 or 3 candidates to launch instant side-by-side calibration</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface px-4 py-1.5 font-mono text-xs font-semibold text-ece9f0 border border-edge hover:border-signal/50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Side-by-Side Calibration Modal */}
      {compareModalOpen && (
        <CandidateCompareModal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          project={project}
          candidates={compareCandidates}
        />
      )}

      {/* Hiring Committee 1-Pager Brief Modal */}
      {briefCandidate && (
        <HiringCommitteeBriefModal
          isOpen={!!briefCandidate}
          onClose={() => setBriefCandidate(null)}
          project={project}
          candidate={briefCandidate}
        />
      )}
    </div>
  );
}
