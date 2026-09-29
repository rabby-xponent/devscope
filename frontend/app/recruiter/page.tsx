'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getJobProjects,
  saveJobProject,
  getActiveJobProjectId,
  setActiveJobProjectId,
  JobProject,
  JobCandidateRecord,
  PipelineStage,
  updateCandidateInProject,
  removeCandidateFromProject,
  batchUpdateCandidatesStage,
  exportPipelineToMarkdown,
} from '@/lib/job-projects';
import {
  getRecruiterAccount,
  RecruiterAccount,
} from '@/lib/recruiter-auth';
import { ThemeToggle } from '@/lib/theme';
import JobGuardrailsModal from '@/components/JobGuardrailsModal';
import NewJobModal from '@/components/NewJobModal';
import RecruiterAccountModal from '@/components/RecruiterAccountModal';
import CandidateCompareModal from '@/components/CandidateCompareModal';
import HiringCommitteeBriefModal from '@/components/HiringCommitteeBriefModal';

function RecruiterPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Recruiter Session & Account
  const [account, setAccount] = useState<RecruiterAccount | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<JobProject[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>('');

  // Modals
  const [showGuardrailsModal, setShowGuardrailsModal] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [briefCandidate, setBriefCandidate] = useState<JobCandidateRecord | null>(null);

  // Candidate Screen Form
  const [candidateHandle, setCandidateHandle] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [showLiveUrlInput, setShowLiveUrlInput] = useState(false);

  // Pipeline Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'fit_desc' | 'fit_asc' | 'rating_desc' | 'date_desc'>('fit_desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);

  useEffect(() => {
    setAccount(getRecruiterAccount());
    const list = getJobProjects();
    setProjects(list);

    const queryJobId = searchParams.get('jobId');
    if (queryJobId && list.some((p) => p.id === queryJobId)) {
      setActiveJobId(queryJobId);
      setActiveJobProjectId(queryJobId);
    } else {
      const active = getActiveJobProjectId();
      setActiveJobId(active);
    }
  }, [searchParams]);

  const activeProject = projects.find((p) => p.id === activeJobId) || projects[0];

  const refreshProjects = () => {
    const list = getJobProjects();
    setProjects(list);
  };

  const handleSelectJobProject = (id: string) => {
    setActiveJobId(id);
    setActiveJobProjectId(id);
    setSelectedIds([]);
  };

  const handleScreenCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const u = candidateHandle.trim().replace(/^@/, '');
    if (!u) return;

    const params = new URLSearchParams();
    if (liveUrl.trim()) params.set('liveUrl', liveUrl.trim());
    if (activeProject) {
      params.set('jobId', activeProject.id);
      params.set('roleTitle', activeProject.title);
    }
    params.set('mode', 'recruiter');

    router.push(`/profile/${encodeURIComponent(u)}?${params.toString()}`);
  };

  // Stage changes
  const handleStageChange = (candId: string, stage: PipelineStage) => {
    if (!activeProject) return;
    updateCandidateInProject(activeProject.id, candId, { pipelineStage: stage });
    refreshProjects();
  };

  const handleRatingChange = (candId: string, rating: number) => {
    if (!activeProject) return;
    updateCandidateInProject(activeProject.id, candId, { starRating: rating });
    refreshProjects();
  };

  const handleSaveNote = (candId: string) => {
    if (!activeProject) return;
    updateCandidateInProject(activeProject.id, candId, { recruiterNotes: editingNoteValue.trim() });
    setEditingNoteId(null);
    refreshProjects();
  };

  const handleRemoveCandidate = (candId: string, username: string) => {
    if (!activeProject) return;
    if (confirm(`Remove @${username} from ${activeProject.title}?`)) {
      removeCandidateFromProject(activeProject.id, candId);
      setSelectedIds((prev) => prev.filter((i) => i !== candId));
      refreshProjects();
    }
  };

  const handleBatchStageChange = (stage: PipelineStage) => {
    if (!activeProject || selectedIds.length === 0) return;
    batchUpdateCandidatesStage(activeProject.id, selectedIds, stage);
    setSelectedIds([]);
    refreshProjects();
  };

  const handleExportMarkdown = () => {
    if (!activeProject) return;
    const md = exportPipelineToMarkdown(activeProject);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  const stageOptions: { value: PipelineStage; label: string }[] = [
    { value: 'new_assessed', label: 'New Assessed' },
    { value: 'phone_screen_scheduled', label: 'Phone Screen' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offer', label: 'Offer Stage' },
    { value: 'archived', label: 'Archived' },
  ];

  // Candidates list filtered & sorted
  const filteredCandidates = useMemo(() => {
    if (!activeProject) return [];
    let list = [...activeProject.candidates];

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
  }, [activeProject, searchQuery, selectedStage, sortBy]);

  const compareCandidates = activeProject
    ? activeProject.candidates.filter((c) => selectedIds.includes(c.id))
    : [];

  if (!activeProject || !account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f5] dark:bg-[#0c0b0e] font-mono text-sm text-slate-500 dark:text-muted">
        Loading RecruiterOS Workspace...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f5] dark:bg-[#0c0b0e] text-slate-900 dark:text-[#ece9f0] pb-24 transition-colors">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 border-b border-[#e8e6df] dark:border-edge/80 bg-white/90 dark:bg-[#0c0b0e]/95 backdrop-blur-md px-6 py-3.5 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-600 dark:bg-signal shadow-[0_0_10px_#ea580c]" />
              <span className="font-mono text-sm font-bold tracking-[0.25em] text-slate-900 dark:text-ece9f0">
                DEVSCOPE
              </span>
            </Link>
            <span className="text-slate-300 dark:text-edge">/</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-orange-100/70 text-orange-700 border-orange-200/80 dark:bg-signal/15 dark:text-signal dark:border-signal/30 px-2 py-0.5 font-mono text-[10px] font-bold border uppercase">
                RecruiterOS
              </span>
              <span className="hidden sm:inline font-mono text-xs text-slate-500 dark:text-muted">
                Enterprise Talent Intelligence
              </span>
            </div>
          </div>

          {/* Recruiter Identity & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Recruiter Profile Card Trigger */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center gap-2.5 rounded-xl border border-[#e8e6df] dark:border-edge/80 bg-white dark:bg-surface/80 px-3 py-1.5 hover:border-orange-500 dark:hover:border-signal/50 shadow-sm transition-colors cursor-pointer text-left"
              title="Edit recruiter identity and default guardrails"
            >
              <div className="h-7 w-7 rounded-full border border-orange-400/40 bg-orange-100 dark:bg-surface flex items-center justify-center overflow-hidden">
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt={account.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-signal">
                    {account.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden md:block">
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-ece9f0 leading-tight">
                  {account.name}
                </div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-muted truncate max-w-[130px]">
                  {account.company}
                </div>
              </div>
              <span className="rounded bg-orange-50 text-orange-700 border-orange-200 dark:bg-signal/10 dark:text-signal dark:border-signal/20 px-1.5 py-0.2 font-mono text-[9px] font-bold border uppercase">
                {account.planTier}
              </span>
            </button>

            <Link
              href="/"
              className="rounded-lg border border-[#e8e6df] dark:border-edge bg-white dark:bg-surface/60 px-3 py-1.5 font-mono text-xs text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-ece9f0 shadow-sm transition-colors"
            >
              ← Public Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Workspace Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Recruiter Welcome Header (Clean, Dageno-inspired White Card) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl border border-[#e8e6df] dark:border-edge/80 bg-white dark:bg-[#121118]/80 p-6 sm:p-7 shadow-sm dark:shadow-xl backdrop-blur-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/70 text-orange-700 dark:bg-signal/15 dark:text-signal border border-orange-200/80 dark:border-signal/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-signal" />
                Welcome back, {account.name}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-muted/60" />
              <span className="font-mono text-xs text-slate-500 dark:text-muted">{account.department}</span>
            </div>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-ece9f0 sm:text-3xl">
              Recruiter Talent Operating System
            </h1>
            <p className="font-sans text-xs text-slate-600 dark:text-muted max-w-2xl leading-relaxed">
              Manage multi-role engineering searches, enforce technical guardrails, audit candidate codebases, and calibrate interview probes with zero guesswork.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-signal dark:hover:bg-signal/90 px-4 py-2 font-mono text-xs font-bold text-white dark:text-ink transition-colors shadow-sm"
            >
              <span>＋</span>
              <span>Create New Job Project</span>
            </button>

            <button
              onClick={() => setShowGuardrailsModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#e8e6df] dark:border-edge bg-white dark:bg-surface/80 px-3.5 py-2 font-mono text-xs font-semibold text-slate-700 dark:text-ece9f0 hover:border-orange-500 dark:hover:border-signal/50 shadow-sm transition-colors"
            >
              <span>⚙️</span>
              <span>Guardrails for Role</span>
            </button>
          </div>
        </div>

        {/* Open Job Projects Selector Strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-muted font-bold">
            <span>Your Open Job Projects ({projects.length})</span>
            <span className="text-[11px] text-orange-600 dark:text-signal font-normal">Click a card to switch active workspace</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {projects.map((proj) => {
              const isSelected = proj.id === activeProject.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectJobProject(proj.id)}
                  className={`group relative rounded-xl p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-signal/10 dark:border-signal dark:ring-signal/40 shadow-sm'
                      : 'border-[#e8e6df] dark:border-edge/80 bg-white dark:bg-[#121118]/60 hover:border-orange-400 dark:hover:border-signal/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-100 text-slate-700 border-slate-200 dark:bg-surface dark:text-muted dark:border-edge/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border">
                      {proj.department}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      👥 {proj.candidates.length} in pipeline
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-mono text-sm font-bold text-slate-900 dark:text-ece9f0 group-hover:text-orange-600 dark:group-hover:text-signal transition-colors truncate">
                    {proj.title}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {proj.requisition.mustHaveSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#0c0b0e] dark:text-muted dark:border-edge/40 px-1.5 py-0.2 font-mono text-[9px] border"
                      >
                        {skill}
                      </span>
                    ))}
                    {proj.requisition.mustHaveSkills.length > 3 && (
                      <span className="font-mono text-[9px] text-slate-400 dark:text-muted/60 self-center">
                        +{proj.requisition.mustHaveSkills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#e8e6df] dark:border-edge/40 pt-2 font-mono text-[10px] text-slate-500 dark:text-muted">
                    <span className="uppercase font-semibold">Target: {proj.requisition.seniorityTarget}</span>
                    <span>Min {proj.guardrails.minimumFitScoreThreshold}% fit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidate Screening Console (Spacious & Clean) */}
        <div className="rounded-2xl border border-[#e8e6df] dark:border-edge/80 bg-white dark:bg-[#121118] p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e8e6df] dark:border-edge/60 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-orange-600 dark:text-signal font-bold">
                Direct Candidate Audit
              </span>
              <h2 className="font-mono text-base font-bold text-slate-900 dark:text-ece9f0">
                Screen Candidate Against: <span className="text-orange-600 dark:text-signal">{activeProject.title}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-muted">
              <span>Target Seniority: <strong className="text-slate-900 dark:text-ece9f0 uppercase">{activeProject.requisition.seniorityTarget}</strong></span>
              <span>·</span>
              <span>Threshold: <strong className="text-orange-600 dark:text-signal">{activeProject.guardrails.minimumFitScoreThreshold}%</strong></span>
            </div>
          </div>

          <form onSubmit={handleScreenCandidate} className="space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e2e0d8] dark:border-edge/80 bg-[#fbfbfa] dark:bg-[#0c0b0e] px-4 py-3 focus-within:border-orange-500 dark:focus-within:border-signal transition-colors">
                <span className="font-mono text-base text-orange-600 dark:text-signal font-bold">@</span>
                <input
                  type="text"
                  value={candidateHandle}
                  onChange={(e) => setCandidateHandle(e.target.value)}
                  placeholder="github-username (e.g. mitchellh, tj, gaearon, shadcn)"
                  className="w-full bg-transparent font-mono text-sm text-slate-900 dark:text-ece9f0 outline-none placeholder:text-slate-400 dark:placeholder:text-muted/40"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-signal dark:hover:bg-signal/90 px-7 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white dark:text-ink transition-all shadow-sm flex-none"
              >
                Screen Candidate
              </button>
            </div>

            {/* Optional Live Demo URL Input */}
            <div>
              {showLiveUrlInput ? (
                <div className="flex items-center gap-2 rounded-xl bg-[#fbfbfa] dark:bg-[#0c0b0e] px-3.5 py-2.5 border border-[#e2e0d8] dark:border-edge/80">
                  <span className="text-sm">🌐</span>
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://candidate-deployed-app.vercel.app (production demo / portfolio)"
                    className="flex-1 bg-transparent font-mono text-xs text-slate-900 dark:text-ece9f0 outline-none placeholder:text-slate-400 dark:placeholder:text-muted/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLiveUrl('');
                      setShowLiveUrlInput(false);
                    }}
                    className="font-mono text-xs text-slate-400 hover:text-orange-600 dark:hover:text-signal"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLiveUrlInput(true)}
                  className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-muted hover:text-orange-600 dark:hover:text-signal transition-colors"
                >
                  <span className="text-orange-600 dark:text-signal font-bold">＋</span>
                  <span>Add live deployed application or portfolio URL (audits production bundle)</span>
                </button>
              )}
            </div>

            {/* Must-Have Stack Summary */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="text-slate-500 dark:text-muted/70">Evaluating for Dealbreakers:</span>
              {activeProject.requisition.mustHaveSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-slate-100 text-slate-800 border-slate-200 dark:bg-[#0c0b0e] dark:text-ece9f0 dark:border-edge/60 px-2 py-0.5 border text-[11px]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </form>
        </div>

        {/* Candidate Pipeline & Leaderboard Section (Spacious & Clean) */}
        <div className="rounded-2xl border border-[#e8e6df] dark:border-edge/80 bg-white dark:bg-[#121118] p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e6df] dark:border-edge/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-orange-600 dark:text-signal font-bold">
                  Candidate Pool
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-muted/60" />
                <span className="font-mono text-xs text-slate-500 dark:text-muted">
                  {activeProject.candidates.length} Evaluated
                </span>
              </div>
              <h2 className="font-mono text-lg font-bold text-slate-900 dark:text-ece9f0">
                Pipeline Leaderboard: {activeProject.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 rounded-lg border border-[#e8e6df] dark:border-edge bg-white dark:bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-ece9f0 hover:border-orange-500 dark:hover:border-signal hover:text-orange-600 dark:hover:text-signal shadow-sm transition-colors"
              >
                <span>{copiedMd ? '✓ Copied Markdown!' : '📋 Export Leaderboard'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuardrailsModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#e8e6df] dark:border-edge bg-white dark:bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-ece9f0 shadow-sm transition-colors"
              >
                <span>⚙️ Guardrails</span>
              </button>
            </div>
          </div>

          {/* Filter, Search & Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Stage Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedStage('all')}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  selectedStage === 'all'
                    ? 'bg-orange-600 text-white font-bold shadow-sm dark:bg-signal dark:text-ink'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-surface/60 dark:text-muted dark:hover:text-ece9f0'
                }`}
              >
                All ({activeProject.candidates.length})
              </button>
              {stageOptions.map((st) => {
                const count = activeProject.candidates.filter((c) => c.pipelineStage === st.value).length;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setSelectedStage(st.value)}
                    className={`rounded-lg px-2.5 py-1 transition-colors ${
                      selectedStage === st.value
                        ? 'bg-orange-600 text-white font-bold shadow-sm dark:bg-signal dark:text-ink'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-surface/60 dark:text-muted dark:hover:text-ece9f0'
                    }`}
                  >
                    {st.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e0d8] dark:border-edge/80 bg-[#fbfbfa] dark:bg-[#0c0b0e] px-2.5 py-1 text-xs">
                <span className="text-slate-400">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate..."
                  className="w-32 sm:w-44 bg-transparent font-mono text-xs text-slate-900 dark:text-ece9f0 outline-none placeholder:text-slate-400 dark:placeholder:text-muted/50"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-orange-600 dark:hover:text-signal text-[10px]">
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-[#e2e0d8] dark:border-edge/80 bg-white dark:bg-surface/80 px-2.5 py-1 font-mono text-xs text-slate-700 dark:text-muted outline-none hover:text-slate-900 dark:hover:text-ece9f0 cursor-pointer shadow-sm"
              >
                <option value="fit_desc">Fit: High → Low</option>
                <option value="fit_asc">Fit: Low → High</option>
                <option value="rating_desc">Rating: Highest</option>
                <option value="date_desc">Evaluated: Newest</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#e8e6df] dark:border-edge/60 bg-white dark:bg-[#09080b]">
            {filteredCandidates.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-slate-500 dark:text-muted space-y-2">
                <div>No candidates found in this stage for {activeProject.title}.</div>
                <div className="text-[11px] text-slate-400 dark:text-muted/60">
                  Screen a candidate using the console above to populate this pipeline.
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#e8e6df] dark:border-edge/60 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-muted/70 bg-slate-50 dark:bg-[#121118]/50">
                    <th className="py-3 pl-3 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredCandidates.length > 0 &&
                          selectedIds.length === filteredCandidates.length
                        }
                        onChange={() => {
                          if (selectedIds.length === filteredCandidates.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(filteredCandidates.map((c) => c.id));
                          }
                        }}
                        className="rounded border-[#e2e0d8] dark:border-edge bg-white dark:bg-surface text-orange-600 dark:text-signal focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-12 text-center">Rank</th>
                    <th className="py-3 px-3 min-w-[200px]">Candidate</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">Fit Score</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Seniority</th>
                    <th className="py-3 px-3 min-w-[130px]">Stack Check</th>
                    <th className="py-3 px-3 min-w-[160px]">Pipeline Stage</th>
                    <th className="py-3 px-3 min-w-[110px]">Rating</th>
                    <th className="py-3 px-3 min-w-[220px]">Recruiter Notes</th>
                    <th className="py-3 pr-3 pl-2 text-right min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e6df] dark:divide-edge/40">
                  {filteredCandidates.map((cand, idx) => {
                    const isSelected = selectedIds.includes(cand.id);
                    const rankBadgeColor =
                      idx === 0
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/40'
                        : idx === 1
                        ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-300/20 dark:text-slate-200 dark:border-slate-300/40'
                        : idx === 2
                        ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-amber-700/20 dark:text-amber-500 dark:border-amber-600/40'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-surface dark:text-muted dark:border-edge/60';

                    return (
                      <tr
                        key={cand.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-orange-50/60 dark:bg-signal/10 border-l-2 border-l-orange-500 dark:border-l-signal'
                            : 'hover:bg-slate-50/70 dark:hover:bg-surface/40'
                        }`}
                      >
                        <td className="py-3.5 pl-3 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(cand.id)
                                  ? prev.filter((i) => i !== cand.id)
                                  : [...prev, cand.id]
                              )
                            }
                            className="rounded border-[#e2e0d8] dark:border-edge bg-white dark:bg-surface text-orange-600 dark:text-signal focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-2 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border ${rankBadgeColor}`}
                          >
                            #{idx + 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full border border-[#e2e0d8] dark:border-edge bg-slate-100 dark:bg-surface overflow-hidden flex-none flex items-center justify-center">
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
                                <span className="font-mono text-xs font-bold text-slate-500 dark:text-muted">
                                  {cand.username.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/profile/${cand.username}?jobId=${activeProject.id}`}
                                target="_blank"
                                className="font-mono text-xs font-bold text-slate-900 dark:text-ece9f0 hover:text-orange-600 dark:hover:text-signal transition-colors block truncate"
                              >
                                {cand.fullName || `@${cand.username}`}
                              </Link>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-muted">
                                <span className="text-orange-600 dark:text-signal">@{cand.username}</span>
                                <span>·</span>
                                <span className="capitalize">{cand.persona.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold border ${
                                cand.fitScore >= 85
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30'
                                  : cand.fitScore >= 70
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30'
                              }`}
                            >
                              {cand.fitScore}%
                            </span>
                            <span className="mt-0.5 text-[9px] text-slate-500 dark:text-muted capitalize truncate max-w-[100px]">
                              {cand.verdict.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="capitalize font-semibold text-slate-900 dark:text-ece9f0">
                              {cand.seniorityEstimate}
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-muted">
                              Target: {activeProject.requisition.seniorityTarget}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓ {cand.requirementsSummary.metCount} Met
                              </span>
                              {cand.requirementsSummary.missingCount > 0 && (
                                <span className="text-rose-600 dark:text-rose-400">
                                  ✕ {cand.requirementsSummary.missingCount}
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-500 dark:text-muted truncate max-w-[130px]">
                              {activeProject.requisition.mustHaveSkills.slice(0, 3).join(', ')}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <select
                            value={cand.pipelineStage}
                            onChange={(e) =>
                              handleStageChange(cand.id, e.target.value as PipelineStage)
                            }
                            className="w-full rounded-lg border border-[#e2e0d8] dark:border-edge/80 bg-white dark:bg-[#0c0b0e] px-2 py-1 font-mono text-[11px] text-slate-800 dark:text-ece9f0 outline-none hover:border-orange-500 dark:hover:border-signal/50 cursor-pointer shadow-sm"
                          >
                            {stageOptions.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-3">
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
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-slate-300 dark:text-muted/30 hover:text-amber-400'
                                }`}
                                title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
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
                                className="w-full rounded border border-orange-500 dark:border-signal bg-white dark:bg-[#0c0b0e] px-2 py-1 font-mono text-xs text-slate-900 dark:text-ece9f0 outline-none"
                              />
                              <button
                                onClick={() => handleSaveNote(cand.id)}
                                className="rounded bg-orange-600 text-white dark:bg-signal dark:text-ink px-2 py-1 text-[10px] font-bold"
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
                              className="group flex items-center justify-between gap-1 rounded p-1 hover:bg-slate-100 dark:hover:bg-surface/60 cursor-pointer"
                              title="Click to edit recruiter notes"
                            >
                              <span className="truncate text-slate-600 dark:text-muted text-[11px] italic font-sans max-w-[190px]">
                                {cand.recruiterNotes || '+ Add note...'}
                              </span>
                              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                ✏️
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 pr-3 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setBriefCandidate(cand)}
                              className="rounded border border-[#e2e0d8] dark:border-edge/80 bg-white dark:bg-surface/60 px-2 py-1 font-mono text-[10px] font-medium text-slate-700 dark:text-ece9f0 hover:border-orange-500 dark:hover:border-signal hover:text-orange-600 dark:hover:text-signal shadow-sm transition-colors"
                              title="View and print 1-pager brief for hiring manager"
                            >
                              EM Brief
                            </button>

                            <Link
                              href={`/profile/${cand.username}?jobId=${activeProject.id}`}
                              target="_blank"
                              className="rounded border border-[#e2e0d8] dark:border-edge/80 bg-white dark:bg-surface/60 px-2 py-1 font-mono text-[10px] font-medium text-slate-500 dark:text-muted hover:border-orange-500 dark:hover:border-signal hover:text-orange-600 dark:hover:text-signal shadow-sm transition-colors"
                              title="Open full interactive audit dossier"
                            >
                              ↗
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleRemoveCandidate(cand.id, cand.username)}
                              className="rounded border border-[#e2e0d8] dark:border-edge/80 bg-white dark:bg-surface/40 px-1.5 py-1 font-mono text-[10px] text-slate-400 dark:text-muted hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
            )}
          </div>
        </div>
      </div>

      {/* Floating Multi-Select Action Bar (Side-by-Side Comparison) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-orange-300 dark:border-signal/40 bg-white/95 dark:bg-[#121118]/95 px-5 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <span className="font-mono text-xs font-bold text-orange-600 dark:text-signal">
            {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
          </span>

          <span className="h-4 w-[1px] bg-slate-200 dark:bg-edge" />

          <button
            type="button"
            disabled={selectedIds.length < 2 || selectedIds.length > 3}
            onClick={() => setCompareModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
              selectedIds.length >= 2 && selectedIds.length <= 3
                ? 'bg-orange-600 text-white dark:bg-signal dark:text-ink hover:opacity-90 shadow-lg'
                : 'bg-slate-100 text-slate-400 dark:bg-surface/80 dark:text-muted/60 cursor-not-allowed border border-slate-200 dark:border-edge/40'
            }`}
          >
            <span>⚖️</span>
            <span>Compare Side-by-Side</span>
          </button>

          <select
            onChange={(e) => {
              if (e.target.value) {
                handleBatchStageChange(e.target.value as PipelineStage);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="rounded-lg border border-[#e2e0d8] dark:border-edge bg-white dark:bg-surface px-2.5 py-1.5 font-mono text-xs text-slate-800 dark:text-ece9f0 outline-none hover:border-orange-500 cursor-pointer"
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

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="font-mono text-xs text-slate-500 dark:text-muted hover:text-slate-900 dark:hover:text-ece9f0 pl-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* Modals */}
      {showAccountModal && account && (
        <RecruiterAccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          account={account}
          onUpdate={(up) => setAccount(up)}
        />
      )}

      {showGuardrailsModal && activeProject && (
        <JobGuardrailsModal
          isOpen={showGuardrailsModal}
          onClose={() => setShowGuardrailsModal(false)}
          project={activeProject}
          onSave={(saved) => {
            saveJobProject(saved);
            refreshProjects();
          }}
        />
      )}

      {showNewJobModal && (
        <NewJobModal
          isOpen={showNewJobModal}
          onClose={() => setShowNewJobModal(false)}
          onCreate={(newProj) => {
            const created = saveJobProject(newProj);
            refreshProjects();
            setActiveJobId(created.id);
            setActiveJobProjectId(created.id);
          }}
        />
      )}

      {compareModalOpen && activeProject && (
        <CandidateCompareModal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          project={activeProject}
          candidates={compareCandidates}
        />
      )}

      {briefCandidate && activeProject && (
        <HiringCommitteeBriefModal
          isOpen={!!briefCandidate}
          onClose={() => setBriefCandidate(null)}
          project={activeProject}
          candidate={briefCandidate}
        />
      )}
    </main>
  );
}

export default function RecruiterPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#faf9f5] dark:bg-[#0c0b0e] font-mono text-sm text-slate-500 dark:text-muted">
          Loading RecruiterOS Workspace...
        </div>
      }
    >
      <RecruiterPortalContent />
    </Suspense>
  );
}
