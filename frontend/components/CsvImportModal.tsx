'use client';

import React, { useState, useRef } from 'react';
import { Icon } from '@/components/icons';
import { generateSampleCandidatesCSV, importCandidatesFromCSV, JobCandidateRecord } from '@/lib/job-projects';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onImportSuccess: (imported: JobCandidateRecord[]) => void;
}

interface ParsedCandidatePreview {
  handle: string;
  fullName?: string;
  liveUrl?: string;
  notes?: string;
  status: 'valid' | 'duplicate' | 'invalid';
}

export default function CsvImportModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onImportSuccess,
}: CsvImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const csvContent = generateSampleCandidatesCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample-gitgrill-candidates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Live preview parser
  const getPreviewList = (): ParsedCandidatePreview[] => {
    if (!csvText.trim()) return [];
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const header = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    let uIdx = header.findIndex((h) =>
      ['username', 'handle', 'github', 'user', 'github username', 'profile'].includes(h)
    );
    const nameIdx = header.findIndex((h) => ['name', 'full name', 'fullname'].includes(h));
    const liveUrlIdx = header.findIndex((h) =>
      ['live app url', 'live url', 'portfolio', 'live_url', 'app url', 'demo'].includes(h)
    );
    const notesIdx = header.findIndex((h) => ['notes', 'recruiter notes', 'note', 'comment'].includes(h));

    let start = 1;
    if (uIdx === -1) {
      uIdx = 0;
      start = 0;
    }

    const seen = new Set<string>();
    const previews: ParsedCandidatePreview[] = [];

    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      const cells: string[] = [];
      let insideQuote = false;
      let current = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());

      const rawHandle = cells[uIdx] ? cells[uIdx].replace(/^["']|["']$/g, '').trim() : '';
      if (!rawHandle) continue;

      const handle = rawHandle
        .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
        .replace(/^@/, '')
        .split('/')[0]
        .split('?')[0]
        .trim();

      const isValid = Boolean(handle && /^[a-zA-Z0-9_-]+$/.test(handle));
      const isDup = seen.has(handle.toLowerCase());
      if (isValid && !isDup) seen.add(handle.toLowerCase());

      previews.push({
        handle: handle || rawHandle,
        fullName: nameIdx >= 0 && cells[nameIdx] ? cells[nameIdx].replace(/^["']|["']$/g, '').trim() : undefined,
        liveUrl: liveUrlIdx >= 0 && cells[liveUrlIdx] ? cells[liveUrlIdx].replace(/^["']|["']$/g, '').trim() : undefined,
        notes: notesIdx >= 0 && cells[notesIdx] ? cells[notesIdx].replace(/^["']|["']$/g, '').trim() : undefined,
        status: !isValid ? 'invalid' : isDup ? 'duplicate' : 'valid',
      });
    }

    return previews;
  };

  const previewList = getPreviewList();
  const validCount = previewList.filter((p) => p.status === 'valid').length;

  const handleExecuteImport = () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    try {
      const result = importCandidatesFromCSV(jobId, csvText);
      onImportSuccess(result.imported);
      onClose();
    } catch {
      /* ignore */
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-edge bg-card p-6 shadow-2xl transition-all sm:p-7 max-h-[90vh] overflow-y-auto thin-scroll">
        <div className="flex items-start justify-between border-b border-edge pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-signal font-bold">
                Batch Candidate Import
              </span>
              <span className="h-1 w-1 rounded-full bg-muted/50" />
              <span className="font-mono text-xs text-muted truncate max-w-[280px]">
                {jobTitle}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-content">
              Import Candidates from CSV
            </h2>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Upload a spreadsheet or paste GitHub handles. Candidates will be batch-enrolled into this requisition.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-well hover:text-content transition-colors"
            aria-label="Close modal"
          >
            <Icon.X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Action Row: Sample Template CTA */}
          <div className="flex items-center justify-between rounded-xl border border-edge bg-well/60 p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-card text-muted">
                <Icon.FileText className="h-4 w-4" />
              </span>
              <div>
                <div className="font-mono text-xs font-semibold text-content">
                  Standard Sourcing CSV Format
                </div>
                <div className="font-mono text-[11px] text-muted">
                  Columns: <code className="text-signal">Username</code>, <code className="text-signal">Full Name</code>, <code className="text-signal">Live App URL</code>, <code className="text-signal">Recruiter Notes</code>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-1.5 font-mono text-xs font-semibold text-content shadow-xs transition-colors hover:border-signal/50 hover:text-signal"
            >
              <Icon.Download className="h-3.5 w-3.5 text-muted" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-signal bg-signal/[0.04]'
                : 'border-edge hover:border-signal/50 bg-well/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-signal/10 text-signal mb-2">
              <Icon.Upload className="h-5 w-5" />
            </span>
            <div className="font-mono text-xs font-semibold text-content">
              {fileName ? fileName : 'Click to upload or drag & drop CSV file'}
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">
              Supports .csv or .txt (plain list of GitHub handles or full spreadsheet)
            </p>
          </div>

          {/* Direct Text Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-xs font-medium text-muted">
                Or paste CSV content / GitHub handles directly:
              </label>
              {csvText && (
                <button
                  type="button"
                  onClick={() => {
                    setCsvText('');
                    setFileName('');
                  }}
                  className="font-mono text-[11px] text-muted hover:text-rose-500"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setFileName('');
              }}
              placeholder={`Username,Full Name,Live App URL,Recruiter Notes\ngaearon,Dan Abramov,https://overreacted.io,React core architect\ntj,TJ Holowaychuk,,Prolific Go developer\nshadcn,shadcn,https://ui.shadcn.com,UI systems spike`}
              className="w-full rounded-xl border border-edge bg-well p-3 font-mono text-xs text-content outline-none transition-colors focus:border-signal/70"
            />
          </div>

          {/* Live Candidate Preview */}
          {previewList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-semibold text-content">
                  Detected Candidates ({previewList.length})
                </span>
                <span className="text-muted">
                  <span className="text-emerald-600 font-bold">{validCount} ready</span>
                  {previewList.length - validCount > 0 && (
                    <span className="ml-2 text-amber-600">({previewList.length - validCount} skipped/invalid)</span>
                  )}
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto thin-scroll rounded-xl border border-edge bg-well/40 divide-y divide-edge/60">
                {previewList.map((cand, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs font-mono">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-full bg-signal/10 text-signal flex items-center justify-center font-bold text-[10px] flex-none">
                        @{cand.handle[0]?.toUpperCase() || '?'}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-content">@{cand.handle}</span>
                        {cand.fullName && cand.fullName !== cand.handle && (
                          <span className="ml-2 text-muted">({cand.fullName})</span>
                        )}
                        {cand.liveUrl && (
                          <span className="ml-2 text-[10px] text-muted truncate max-w-[150px] inline-block align-bottom">
                            · {cand.liveUrl}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        cand.status === 'valid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30'
                          : cand.status === 'duplicate'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30'
                      }`}
                    >
                      {cand.status === 'valid' ? 'Valid' : cand.status === 'duplicate' ? 'Duplicate' : 'Invalid'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-edge pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-edge bg-card px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-muted hover:border-signal/50 hover:text-content transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isImporting}
              onClick={handleExecuteImport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-signal/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon.Check className="h-3.5 w-3.5" />
              <span>Import {validCount > 0 ? `${validCount} Candidate${validCount > 1 ? 's' : ''}` : 'Candidates'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
