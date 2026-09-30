'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SavedRequisition } from '@/lib/requisitions';
import { Icon } from '@/components/icons';

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
          aria-expanded={isOpen}
          className={`flex flex-1 items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-2.5 text-left font-mono text-xs transition-all shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40 ${
            isOpen ? 'border-signal ring-2 ring-signal/20' : 'border-edge hover:border-signal/60'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-edge bg-well text-muted">
              <Icon.Target className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <span className="text-muted/80 text-[10px] uppercase tracking-wider block font-sans">
                {label}
              </span>
              <span className="font-semibold text-content truncate block">
                {activeReq ? activeReq.title : 'General Profile Audit (No JD)'}
                {activeReq?.company && (
                  <span className="ml-1.5 text-muted font-normal">· {activeReq.company}</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-none">
            <span className="text-[10px] text-muted">Change</span>
            <Icon.ChevronDown
              className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-signal' : ''
              }`}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex flex-none items-center gap-1.5 rounded-xl border border-signal/40 bg-signal/10 px-3 py-2.5 font-mono text-xs text-signal transition-all hover:bg-signal hover:text-[#0c0b0e] shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
          title="Save a new Job Description"
        >
          <Icon.Plus className="h-3.5 w-3.5" />
          New JD
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-edge bg-card p-1.5 shadow-pop thin-scroll animate-in">
          <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted border-b border-edge">
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
                ? 'bg-signal/10 text-signal font-semibold border border-signal/30'
                : 'border border-transparent text-content hover:bg-well'
            }`}
          >
            <div>
              <div className="font-medium">General Profile Audit (No Specific JD)</div>
              <div className="text-[10px] text-muted font-sans mt-0.5">
                Evaluates open-source engineering depth, architecture, and code quality.
              </div>
            </div>
            {!activeRoleId && <Icon.Check className="h-3.5 w-3.5 flex-none text-signal" />}
          </button>

          <div className="my-1 border-t border-edge" />

          {/* List of Saved Roles */}
          <div className="space-y-1">
            {requisitions.map((req) => {
              const isSelected = req.id === activeRoleId;
              const isCustom = req.id.startsWith('req_custom_');

              return (
                <div
                  key={req.id}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors border ${
                    isSelected
                      ? 'bg-signal/10 text-signal border-signal/30'
                      : 'border-transparent text-content hover:bg-well'
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
                        <span className="rounded border border-edge bg-well px-1.5 py-0.5 font-mono text-[10px] text-muted">
                          {req.company}
                        </span>
                      )}
                    </div>

                    {req.coreStack && req.coreStack.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-muted">
                        {req.coreStack.slice(0, 3).map((tech) => (
                          <span key={tech} className="text-muted/90">
                            #{tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-2 pl-2">
                    {isSelected && <Icon.Check className="h-3.5 w-3.5 flex-none text-signal" />}
                    {isCustom && onDeleteRole && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete saved role "${req.title}"?`)) {
                            onDeleteRole(req.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted transition-opacity hover:text-rose-500"
                        title="Delete this role"
                      >
                        <Icon.X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="my-1 border-t border-edge" />

          {/* Bottom Action */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCreateModal();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal/10 py-2 font-mono text-xs font-semibold text-signal transition-colors hover:bg-signal hover:text-[#0c0b0e]"
          >
            <Icon.Plus className="h-3.5 w-3.5" />
            <span>Create & Save New Job Description</span>
          </button>
        </div>
      )}
    </div>
  );
}
