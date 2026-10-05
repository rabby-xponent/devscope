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
import { AccountMenu } from '@/components/AccountMenu';
import { useSession } from '@/components/SessionProvider';
import { Icon } from '@/components/icons';
import { Select, Checkbox, StarRating, SearchInput, SegmentedTabs } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
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
  const { user: sessionUser, loading: sessionLoading } = useSession();

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

  const stageSelectOptions: SelectOption[] = stageOptions.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  const sortOptions: SelectOption[] = [
    { value: 'fit_desc', label: 'Fit: High → Low' },
    { value: 'fit_asc', label: 'Fit: Low → High' },
    { value: 'rating_desc', label: 'Rating: Highest' },
    { value: 'date_desc', label: 'Evaluated: Newest' },
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
      <div className="flex min-h-screen items-center justify-center bg-canvas font-mono text-sm text-muted">
        Loading RecruiterOS Workspace…
      </div>
    );
  }

  return (
    <main className="page-texture min-h-screen bg-canvas text-content pb-24 transition-colors">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 border-b border-edge bg-card/90 backdrop-blur-md px-6 py-3.5 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-signal shadow-[0_0_10px_rgb(var(--signal-rgb)/0.5)]" />
              <span className="font-mono text-sm font-bold tracking-[0.25em] text-content">
                DEVSCOPE
              </span>
            </Link>
            <span className="text-edge">/</span>
            <div className="flex items-center gap-2">
              <span className="rounded border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-signal">
                RecruiterOS
              </span>
              <span className="hidden sm:inline font-mono text-xs text-muted">
                Enterprise Talent Intelligence
              </span>
            </div>
          </div>

          {/* Recruiter Identity & Actions */}
          <div className="flex items-center gap-2.5">
            <AccountMenu workspace="recruiter" />
            {!sessionLoading && !sessionUser && (
              <span
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-edge bg-well px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted"
                title="Your requisitions and screenings stay in this browser until you sign in."
              >
                <Icon.Info className="h-3 w-3" />
                Local-only demo mode
              </span>
            )}
            <ThemeToggle />

            {/* Recruiter Profile Card Trigger */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center gap-2.5 rounded-xl border border-edge bg-card px-3 py-1.5 shadow-xs transition-colors hover:border-signal/50 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              title="Edit recruiter identity and default guardrails"
            >
              <div className="h-7 w-7 rounded-full border border-signal/30 bg-signal/10 flex items-center justify-center overflow-hidden">
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt={account.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-mono text-xs font-bold text-signal">
                    {account.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden md:block">
                <div className="font-mono text-xs font-bold text-content leading-tight">
                  {account.name}
                </div>
                <div className="font-mono text-[10px] text-muted truncate max-w-[130px]">
                  {account.company}
                </div>
              </div>
              <span className="rounded border border-signal/25 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-signal">
                {account.planTier}
              </span>
            </button>

            <Link
              href="/"
              className="rounded-lg border border-edge bg-card px-3 py-1.5 font-mono text-xs text-muted shadow-xs transition-colors hover:border-signal/50 hover:text-signal"
            >
              ← Public Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Workspace Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Recruiter Welcome Header */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl border border-edge bg-card p-6 sm:p-7 shadow-card overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-bold text-signal">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                Welcome back, {account.name}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted/50" />
              <span className="font-mono text-xs text-muted">{account.department}</span>
            </div>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Recruiter Talent Operating System
            </h1>
            <p className="font-sans text-xs text-muted max-w-2xl leading-relaxed">
              Manage multi-role engineering searches, enforce technical guardrails, audit candidate codebases, and calibrate interview probes with zero guesswork.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 font-mono text-xs font-bold text-[#0c0b0e] transition-colors hover:bg-signal/90 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <Icon.Plus className="h-3.5 w-3.5" />
              <span>Create New Job Project</span>
            </button>

            <button
              onClick={() => setShowGuardrailsModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3.5 py-2 font-mono text-xs font-semibold text-content shadow-xs transition-colors hover:border-signal/50 hover:text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <Icon.Settings className="h-3.5 w-3.5 text-muted" />
              <span>Guardrails for Role</span>
            </button>
          </div>
        </div>

        {/* Open Job Projects Selector Strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-muted font-bold">
            <span>Your Open Job Projects ({projects.length})</span>
            <span className="text-[11px] text-signal font-normal">Click a card to switch active workspace</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {projects.map((proj) => {
              const isSelected = proj.id === activeProject.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectJobProject(proj.id)}
                  className={`group relative rounded-xl p-4 border transition-all cursor-pointer outline-none ${
                    isSelected
                      ? 'border-signal ring-2 ring-signal/25 bg-signal/[0.06] shadow-card'
                      : 'border-edge bg-card hover:border-signal/50 shadow-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-edge bg-well px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted">
                      {proj.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-content">
                      <Icon.Users className="h-3.5 w-3.5 text-muted" />
                      {proj.candidates.length} in pipeline
                    </span>
                  </div>

                  <h3 className={`mt-2.5 font-mono text-sm font-bold transition-colors truncate ${isSelected ? 'text-signal' : 'text-content group-hover:text-signal'}`}>
                    {proj.title}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {proj.requisition.mustHaveSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded border border-edge bg-well px-1.5 py-0.5 font-mono text-[9px] text-muted"
                      >
                        {skill}
                      </span>
                    ))}
                    {proj.requisition.mustHaveSkills.length > 3 && (
                      <span className="font-mono text-[9px] text-muted/70 self-center">
                        +{proj.requisition.mustHaveSkills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-edge pt-2 font-mono text-[10px] text-muted">
                    <span className="uppercase font-semibold">Target: {proj.requisition.seniorityTarget}</span>
                    <span>Min {proj.guardrails.minimumFitScoreThreshold}% fit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidate Screening Console */}
        <div className="rounded-2xl border border-edge bg-card p-6 sm:p-7 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                Direct Candidate Audit
              </span>
              <h2 className="font-mono text-base font-bold text-content">
                Screen Candidate Against: <span className="text-signal">{activeProject.title}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <span>Target Seniority: <strong className="text-content uppercase">{activeProject.requisition.seniorityTarget}</strong></span>
              <span>·</span>
              <span>Threshold: <strong className="text-signal">{activeProject.guardrails.minimumFitScoreThreshold}%</strong></span>
            </div>
          </div>

          <form onSubmit={handleScreenCandidate} className="space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-edge bg-well px-4 py-3 transition-colors focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/15">
                <span className="font-mono text-base text-signal font-bold">@</span>
                <input
                  type="text"
                  value={candidateHandle}
                  onChange={(e) => setCandidateHandle(e.target.value)}
                  placeholder="github-username (e.g. mitchellh, tj, gaearon, shadcn)"
                  className="w-full bg-transparent font-mono text-sm text-content outline-none placeholder:text-muted/60"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-signal px-7 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#0c0b0e] transition-all shadow-xs flex-none hover:bg-signal/90 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                Screen Candidate
              </button>
            </div>

            {/* Optional Live Demo URL Input */}
            <div>
              {showLiveUrlInput ? (
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-well px-3.5 py-2.5 transition-colors focus-within:border-signal/70">
                  <Icon.Globe className="h-3.5 w-3.5 flex-none text-muted" />
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://candidate-deployed-app.vercel.app (production demo / portfolio)"
                    className="flex-1 bg-transparent font-mono text-xs text-content outline-none placeholder:text-muted/60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLiveUrl('');
                      setShowLiveUrlInput(false);
                    }}
                    aria-label="Remove live URL"
                    className="rounded p-0.5 text-muted transition-colors hover:text-signal"
                  >
                    <Icon.X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLiveUrlInput(true)}
                  className="flex items-center gap-1.5 font-mono text-[11px] text-muted transition-colors hover:text-signal"
                >
                  <Icon.Plus className="h-3 w-3 text-signal" />
                  <span>Add live deployed application or portfolio URL (audits production bundle)</span>
                </button>
              )}
            </div>

            {/* Must-Have Stack Summary */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="text-muted/80">Evaluating for Dealbreakers:</span>
              {activeProject.requisition.mustHaveSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-edge bg-well px-2 py-0.5 text-[11px] text-content"
                >
                  {skill}
                </span>
              ))}
            </div>
          </form>
        </div>

        {/* Candidate Pipeline & Leaderboard Section */}
        <div className="rounded-2xl border border-edge bg-card p-6 sm:p-7 shadow-card space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                  Candidate Pool
                </span>
                <span className="h-1 w-1 rounded-full bg-muted/50" />
                <span className="font-mono text-xs text-muted">
                  {activeProject.candidates.length} Evaluated
                </span>
              </div>
              <h2 className="font-mono text-lg font-bold text-content">
                Pipeline Leaderboard: {activeProject.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-1.5 font-mono text-xs font-semibold text-content shadow-xs transition-colors hover:border-signal/50 hover:text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <Icon.Clipboard className="h-3.5 w-3.5 text-muted" />
                <span>{copiedMd ? 'Copied' : 'Export Leaderboard'}</span>
                {copiedMd && <Icon.Check className="h-3 w-3 text-signal" />}
              </button>

              <button
                type="button"
                onClick={() => setShowGuardrailsModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-1.5 font-mono text-xs font-semibold text-content shadow-xs transition-colors hover:border-signal/50 hover:text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                <Icon.Settings className="h-3.5 w-3.5 text-muted" />
                <span>Guardrails</span>
              </button>
            </div>
          </div>

          {/* Filter, Search & Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <SegmentedTabs
              active={selectedStage}
              onChange={setSelectedStage}
              tabs={[
                { value: 'all', label: 'All', count: activeProject.candidates.length },
                ...stageOptions.map((st) => ({
                  value: st.value,
                  label: st.label,
                  count: activeProject.candidates.filter((c) => c.pipelineStage === st.value).length,
                })),
              ]}
            />

            {/* Search & Sort */}
            <div className="flex items-center gap-2">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search candidate…"
                className="w-40 sm:w-52"
              />

              <Select
                value={sortBy}
                onChange={(v) => setSortBy(v as typeof sortBy)}
                options={sortOptions}
                ariaLabel="Sort candidates"
                className="w-44"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-edge bg-card">
            {filteredCandidates.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-muted space-y-2">
                <div>No candidates found in this stage for {activeProject.title}.</div>
                <div className="text-[11px] text-muted/70">
                  Screen a candidate using the console above to populate this pipeline.
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-edge text-left font-mono text-[10px] uppercase tracking-wider text-muted bg-well">
                    <th className="py-3 pl-3 pr-2 w-8">
                      <Checkbox
                        checked={
                          filteredCandidates.length > 0 &&
                          selectedIds.length === filteredCandidates.length
                        }
                        onChange={(checked) => {
                          setSelectedIds(checked ? filteredCandidates.map((c) => c.id) : []);
                        }}
                        ariaLabel="Select all candidates"
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
                <tbody className="divide-y divide-edge">
                  {filteredCandidates.map((cand, idx) => {
                    const isSelected = selectedIds.includes(cand.id);

                    return (
                      <tr
                        key={cand.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-signal/[0.07] border-l-2 border-l-signal'
                            : 'hover:bg-well/60'
                        }`}
                      >
                        <td className="py-3.5 pl-3 pr-2">
                          <Checkbox
                            checked={isSelected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(cand.id)
                                  ? prev.filter((i) => i !== cand.id)
                                  : [...prev, cand.id]
                              )
                            }
                            ariaLabel={`Select ${cand.username}`}
                          />
                        </td>

                        <td className="py-3.5 px-2 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border ${
                              idx === 0
                                ? 'border-signal/40 bg-signal/15 text-signal'
                                : idx === 1
                                ? 'border-edge bg-well text-content'
                                : idx === 2
                                ? 'border-signal/25 bg-signal/[0.07] text-signal/90'
                                : 'border-edge bg-card text-muted'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full border border-edge bg-well overflow-hidden flex-none flex items-center justify-center">
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
                                href={`/profile/${cand.username}?jobId=${activeProject.id}`}
                                target="_blank"
                                className="font-mono text-xs font-bold text-content hover:text-signal transition-colors block truncate"
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

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`rounded-lg border px-2 py-0.5 font-mono text-xs font-bold ${
                                cand.fitScore >= 85
                                  ? 'border-signal/35 bg-signal/10 text-signal'
                                  : cand.fitScore >= 70
                                  ? 'border-edge bg-well text-content'
                                  : 'border-edge bg-well text-muted'
                              }`}
                            >
                              {cand.fitScore}%
                            </span>
                            <span className="mt-0.5 text-[9px] text-muted capitalize truncate max-w-[100px]">
                              {cand.verdict.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="capitalize font-semibold text-content">
                              {cand.seniorityEstimate}
                            </span>
                            <span className="text-[9px] text-muted">
                              Target: {activeProject.requisition.seniorityTarget}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="inline-flex items-center gap-1 text-signal font-bold">
                                <Icon.Check className="h-3 w-3" />
                                {cand.requirementsSummary.metCount} Met
                              </span>
                              {cand.requirementsSummary.missingCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-muted">
                                  <Icon.X className="h-3 w-3" />
                                  {cand.requirementsSummary.missingCount}
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-muted truncate max-w-[130px]">
                              {activeProject.requisition.mustHaveSkills.slice(0, 3).join(', ')}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <Select
                            value={cand.pipelineStage}
                            onChange={(v) => handleStageChange(cand.id, v as PipelineStage)}
                            options={stageSelectOptions}
                            ariaLabel={`Pipeline stage for ${cand.username}`}
                            buttonClassName="py-1 text-[11px]"
                          />
                        </td>

                        <td className="py-3.5 px-3">
                          <StarRating
                            value={cand.starRating || 0}
                            onChange={(rating) => handleRatingChange(cand.id, rating)}
                          />
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
                                className="w-full rounded border border-signal bg-card px-2 py-1 font-mono text-xs text-content outline-none ring-2 ring-signal/20"
                              />
                              <button
                                onClick={() => handleSaveNote(cand.id)}
                                className="rounded bg-signal px-2 py-1 text-[10px] font-bold text-[#0c0b0e]"
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
                              className="group flex items-center justify-between gap-1 rounded p-1 hover:bg-well cursor-pointer"
                              title="Click to edit recruiter notes"
                            >
                              <span className="truncate text-muted text-[11px] italic font-sans max-w-[190px]">
                                {cand.recruiterNotes || '+ Add note…'}
                              </span>
                              <Icon.Pencil className="h-3 w-3 flex-none text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 pr-3 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setBriefCandidate(cand)}
                              className="rounded border border-edge bg-card px-2 py-1 font-mono text-[10px] font-medium text-content shadow-xs transition-colors hover:border-signal/50 hover:text-signal"
                              title="View and print 1-pager brief for hiring manager"
                            >
                              EM Brief
                            </button>

                            <Link
                              href={`/profile/${cand.username}?jobId=${activeProject.id}`}
                              target="_blank"
                              className="flex h-[26px] w-[26px] items-center justify-center rounded border border-edge bg-card text-muted shadow-xs transition-colors hover:border-signal/50 hover:text-signal"
                              title="Open full interactive audit dossier"
                            >
                              <Icon.ArrowUpRight className="h-3 w-3" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleRemoveCandidate(cand.id, cand.username)}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded border border-edge bg-card text-muted transition-colors hover:border-rose-400/60 hover:text-rose-500"
                              title="Remove candidate from this job"
                            >
                              <Icon.X className="h-3 w-3" />
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

      {/* Floating Multi-Select Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-signal/40 bg-card/95 px-5 py-3 shadow-pop backdrop-blur-md animate-in">
          <span className="font-mono text-xs font-bold text-signal">
            {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
          </span>

          <span className="h-4 w-[1px] bg-edge" />

          <button
            type="button"
            disabled={selectedIds.length < 2 || selectedIds.length > 3}
            onClick={() => setCompareModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
              selectedIds.length >= 2 && selectedIds.length <= 3
                ? 'bg-signal text-[#0c0b0e] hover:bg-signal/90 shadow-xs'
                : 'cursor-not-allowed border border-edge bg-well text-muted/60'
            }`}
          >
            <Icon.Scale className="h-3.5 w-3.5" />
            <span>Compare Side-by-Side</span>
          </button>

          <Select
            value=""
            onChange={(v) => {
              if (v) handleBatchStageChange(v as PipelineStage);
            }}
            options={[{ value: '', label: 'Move To Stage…' }, ...stageSelectOptions]}
            placeholder="Move To Stage…"
            ariaLabel="Batch move selected candidates to stage"
            className="w-44"
          />

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="font-mono text-xs text-muted hover:text-content pl-1"
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
        <div className="flex min-h-screen items-center justify-center bg-canvas font-mono text-sm text-muted">
          Loading RecruiterOS Workspace…
        </div>
      }
    >
      <RecruiterPortalContent />
    </Suspense>
  );
}
