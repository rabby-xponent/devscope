'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SavedRequisition } from '@/lib/requisitions';

interface RequisitionSelectProps {
  requisitions: SavedRequisition[];
  activeRoleId: string;
  onSelectRole: (roleId: string) => void;
  onOpenCreateModal: () => void;
  onDeleteRole?: (roleId: string) => void;
  label?: string;
}

export default function RequisitionSelect({
  requisitions,
  activeRoleId,
  onSelectRole,
  onOpenCreateModal,
  onDeleteRole,
  label = 'Target Requisition:',
}: RequisitionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Esc key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const activeReq = requisitions.find((r) => r.id === activeRoleId);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selector Trigger Button */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center justify-between gap-3 rounded-lg border border-edge/70 bg-[#0c0b0e]/90 px-3.5 py-2.5 text-left font-mono text-xs transition-all hover:border-signal/60 hover:bg-[#141217]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-signal text-sm">🎯</span>
            <div className="min-w-0">
              <span className="text-muted/70 text-[10px] uppercase tracking-wider block font-sans">
                {label}
              </span>
              <span className="font-semibold text-ece9f0 truncate block">
                {activeReq ? activeReq.title : 'General Profile Audit (No JD)'}
                {activeReq?.company && (
                  <span className="ml-1.5 text-muted font-normal">· {activeReq.company}</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-none">
            <span className="text-[10px] text-muted">Change</span>
            <span
              className={`text-muted transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-signal' : ''
              }`}
            >
              ▾
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex-none rounded-lg border border-edge/70 bg-surface/60 px-3 py-2.5 font-mono text-xs text-signal transition-all hover:border-signal/70 hover:bg-signal/10 hover:shadow-sm"
          title="Save a new Job Description"
        >
          <span className="font-bold">＋</span> New JD
        </button>
      </div>

      {/* Bespoke Dark Glass Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-edge/90 bg-[#121116] p-1.5 shadow-2xl backdrop-blur-xl thin-scroll">
          <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted/70 border-b border-edge/40">
            Saved Job Requisitions
          </div>

          {/* Option: General Audit (No JD) */}
          <button
            type="button"
            onClick={() => {
              onSelectRole('');
              setIsOpen(false);
            }}
            className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors ${
              !activeRoleId
                ? 'bg-signal/15 text-signal font-semibold border border-signal/30'
                : 'text-ece9f0 hover:bg-surface/80 hover:text-signal'
            }`}
          >
            <div>
              <div className="font-medium">General Profile Audit (No Specific JD)</div>
              <div className="text-[10px] text-muted font-sans mt-0.5">
                Evaluates open-source engineering depth, architecture, and code quality.
              </div>
            </div>
            {!activeRoleId && <span className="text-signal text-sm">✓</span>}
          </button>

          <div className="my-1 border-t border-edge/40" />

          {/* List of Saved Roles */}
          <div className="space-y-1">
            {requisitions.map((req) => {
              const isSelected = req.id === activeRoleId;
              const isCustom = req.id.startsWith('req_custom_');

              return (
                <div
                  key={req.id}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-signal/15 text-signal border border-signal/30'
                      : 'hover:bg-surface/80 text-ece9f0'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRole(req.id);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold truncate">{req.title}</span>
                      {req.company && (
                        <span className="rounded bg-[#0c0b0e] px-1.5 py-0.5 font-mono text-[10px] text-muted border border-edge/50">
                          {req.company}
                        </span>
                      )}
                    </div>

                    {req.coreStack && req.coreStack.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-muted">
                        {req.coreStack.slice(0, 3).map((tech) => (
                          <span key={tech} className="text-muted/80">
                            #{tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-2 pl-2">
                    {isSelected && <span className="text-signal text-sm">✓</span>}
                    {isCustom && onDeleteRole && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete saved role "${req.title}"?`)) {
                            onDeleteRole(req.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 p-1 font-mono text-xs transition-opacity"
                        title="Delete this role"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="my-1 border-t border-edge/40" />

          {/* Bottom Action */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCreateModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface/50 py-2 font-mono text-xs font-semibold text-signal transition-colors hover:bg-signal hover:text-ink"
          >
            <span>＋</span>
            <span>Create & Save New Job Description</span>
          </button>
        </div>
      )}
    </div>
  );
}
