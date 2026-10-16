'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { TargetRole } from '@/lib/target-roles';
import {
  ResumeProfile,
  getResumes,
  saveResume,
  branchResumeVariant,
  evaluateResumeAgainstJD,
  JDMatchReport,
  exportResumeAsMarkdown,
} from '@/lib/resumes';

export function ResumeTailorModal({
  role,
  onClose,
}: {
  role: TargetRole;
  onClose: () => void;
}) {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [reports, setReports] = useState<Record<string, JDMatchReport>>({});
  const [copied, setCopied] = useState(false);
  const [savedVariant, setSavedVariant] = useState(false);

  useEffect(() => {
    const list = getResumes();
    setResumes(list);

    if (list.length > 0) {
      const repMap: Record<string, JDMatchReport> = {};
      let highestFitId = list[0].id;
      let highestScore = -1;

      for (const res of list) {
        const rep = evaluateResumeAgainstJD(res, role.rawJdText);
        repMap[res.id] = rep;
        if (rep.fitScore > highestScore) {
          highestScore = rep.fitScore;
          highestFitId = res.id;
        }
      }

      setReports(repMap);
      setSelectedResumeId(highestFitId);
    }
  }, [role]);

  const activeResume = resumes.find((r) => r.id === selectedResumeId);
  const activeReport = selectedResumeId ? reports[selectedResumeId] : undefined;

  const handleCopyTailored = () => {
    if (!activeResume) return;
    const baseMd = exportResumeAsMarkdown(activeResume);
    navigator.clipboard.writeText(baseMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsVariant = () => {
    if (!activeResume || !activeReport) return;
    const derivedTitle = `${activeResume.fullName || activeResume.title} — ${role.company}`;
    const derived = branchResumeVariant(activeResume, derivedTitle, activeResume.targetRoleType);

    const updatedExperience = derived.experience.map((exp) => {
      const updatedBullets = exp.bullets.map((b) => {
        const match = activeReport.bulletRecommendations.find((r) => r.original === b);
        return match ? match.tailored : b;
      });
      return { ...exp, bullets: updatedBullets };
    });

    saveResume({
      ...derived,
      experience: updatedExperience,
      versionLabel: `Tailored for ${role.company}`,
    });

    setSavedVariant(true);
    setTimeout(() => {
      setSavedVariant(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="fade-up relative w-full max-w-3xl my-auto rounded-2xl border border-edge bg-card p-6 sm:p-7 shadow-card max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-edge mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-signal/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-signal">
                AI Resume Tailoring Studio
              </span>
              <span className="font-mono text-xs text-muted">
                Target: {role.company}
              </span>
            </div>
            <h3 className="mt-1 font-mono text-base font-bold text-content">
              {role.title}
            </h3>
            <p className="font-sans text-xs text-muted mt-0.5">
              Rank your saved resume profiles against this specific JD and optimize key bullet points with real proof.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-content p-1 rounded-lg hover:bg-well transition-colors"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="py-8 text-center space-y-3 font-mono">
            <p className="text-xs text-muted">
              You haven&apos;t added any resumes to your vault yet.
            </p>
            <p className="font-sans text-xs text-muted">
              Create a resume profile in the Resume Vault first to see match rankings and tailoring suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resume Selection & Match Ranking Cards */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                1. Select Resume Profile (Ranked by Match Fit)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resumes.map((res) => {
                  const rep = reports[res.id];
                  const isSelected = res.id === selectedResumeId;
                  const fit = rep?.fitScore ?? 50;

                  return (
                    <div
                      key={res.id}
                      onClick={() => setSelectedResumeId(res.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all text-left ${
                        isSelected
                          ? 'border-signal bg-signal/10 ring-2 ring-signal/20'
                          : 'border-edge bg-well/40 hover:border-signal/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-content truncate flex-1">
                          {res.title}
                        </span>
                        <span className={`font-extrabold ${fit >= 75 ? 'text-emerald-500' : 'text-signal'}`}>
                          {fit}%
                        </span>
                      </div>
                      <div className="font-sans text-[11px] text-muted truncate mt-0.5">
                        {res.targetRoleType}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match Analysis for Active Selection */}
            {activeReport && (
              <div className="space-y-4">
                {/* Skills Match vs Gaps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider">
                      <Icon.Check className="h-4 w-4" />
                      <span>Directly Matched Keywords ({activeReport.matchedSkills.length})</span>
                    </div>
                    {activeReport.matchedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeReport.matchedSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-500 font-semibold uppercase"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-sans text-xs text-muted">
                        No direct keywords detected between your stack and this JD.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#ea580c] dark:text-signal uppercase tracking-wider">
                      <Icon.Alert className="h-4 w-4" />
                      <span>JD Requirements Missing From Profile ({activeReport.missingSkills.length})</span>
                    </div>
                    {activeReport.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeReport.missingSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] text-[#ea580c] dark:text-signal uppercase font-semibold"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-sans text-xs text-muted">
                        All primary technical requirements in this JD are represented in your profile.
                      </p>
                    )}
                  </div>
                </div>

                {/* Targeted Bullet Enhancements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-content flex items-center gap-1.5">
                      <Icon.Lightbulb className="h-4 w-4 text-signal" />
                      <span>2. Recommended Bullet Adjustments for this Job</span>
                    </div>
                    <span className="font-sans text-[11px] text-muted">
                      Tailored specifically to address {role.company}&apos;s JD
                    </span>
                  </div>

                  {activeReport.bulletRecommendations.length === 0 ? (
                    <div className="rounded-xl border border-edge bg-well/40 p-4 text-center font-sans text-xs text-muted">
                      Your current experience bullets already tightly address this JD&apos;s requirements.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeReport.bulletRecommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-edge bg-well/30 p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] text-muted border-b border-edge/60 pb-1.5">
                            <span className="font-bold text-content">{rec.company}</span>
                            <span className="text-signal">Tailoring Rationale</span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="font-mono text-[11px] text-rose-500/90 bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5">
                              <span className="font-bold uppercase text-[9px] block text-rose-500 mb-0.5">Original:</span>
                              {rec.original}
                            </div>
                            <div className="font-mono text-[11px] text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
                              <span className="font-bold uppercase text-[9px] block text-emerald-500 mb-0.5">Tailored For This JD:</span>
                              {rec.tailored}
                            </div>
                          </div>

                          <p className="font-sans text-[11px] text-muted leading-tight">
                            {rec.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-edge">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-edge px-4 py-2 font-mono text-xs font-semibold text-muted hover:text-content transition-colors"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTailored}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-well px-3.5 py-2 font-mono text-xs font-semibold text-content hover:border-signal/50 transition-colors"
                    >
                      <Icon.Copy className="h-3.5 w-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAsVariant}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 font-mono text-xs font-bold text-white shadow-xs hover:bg-signal/90 transition-all"
                    >
                      <Icon.Sparkle className="h-3.5 w-3.5" />
                      <span>{savedVariant ? '✓ Saved as New Variant!' : `Save as ${role.company} Variant`}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
