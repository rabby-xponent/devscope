'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getJobProjects,
  getActiveJobProjectId,
  setActiveJobProjectId,
  JobProject,
  saveJobProject,
} from '@/lib/job-projects';
import JobCandidatePipelineModal from '@/components/JobCandidatePipelineModal';
import JobGuardrailsModal from '@/components/JobGuardrailsModal';
import NewJobModal from '@/components/NewJobModal';

function PipelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projects, setProjects] = useState<JobProject[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>('');
  const [showGuardrailsModal, setShowGuardrailsModal] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  useEffect(() => {
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

  const handleRefreshProjects = () => {
    const list = getJobProjects();
    setProjects(list);
  };

  const handleSelectProject = (projectId: string) => {
    setActiveJobId(projectId);
    setActiveJobProjectId(projectId);
    router.push(`/pipeline?jobId=${projectId}`);
  };

  const handleSaveGuardrails = (updatedProject: JobProject) => {
    saveJobProject(updatedProject);
    handleRefreshProjects();
  };

  const handleCreateJob = (newProject: Partial<JobProject> & { title: string }) => {
    const created = saveJobProject(newProject);
    handleRefreshProjects();
    setActiveJobId(created.id);
    setActiveJobProjectId(created.id);
    router.push(`/pipeline?jobId=${created.id}`);
  };

  const handleScreenCandidate = (username: string) => {
    router.push(`/profile/${encodeURIComponent(username)}?jobId=${activeJobId}&mode=recruiter`);
  };

  if (!activeProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0b0e] text-muted font-mono text-sm">
        Loading RecruiterOS Pipeline...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0b0e] text-[#ece9f0]">
      {/* Top Nav */}
      <nav className="border-b border-edge/80 bg-[#0c0b0e]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-signal shadow-[0_0_10px_#f0a04b]" />
              <span className="font-mono text-sm font-bold tracking-[0.25em] text-ece9f0">
                DEVSCOPE
              </span>
            </Link>
            <span className="text-edge">/</span>
            <span className="font-mono text-xs font-semibold text-signal uppercase tracking-wider">
              RecruiterOS Pipeline Command Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold text-signal transition-colors hover:bg-signal hover:text-ink"
            >
              <span>＋</span>
              <span>New Job Project</span>
            </button>

            <Link
              href="/"
              className="rounded-lg border border-edge bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted hover:text-ece9f0 transition-colors"
            >
              ← Back to Console
            </Link>
          </div>
        </div>
      </nav>

      {/* Embedded Master Pipeline View */}
      <div className="p-4 sm:p-6 mx-auto max-w-7xl">
        <JobCandidatePipelineModal
          isOpen={true}
          onClose={() => router.push('/')}
          project={activeProject}
          projects={projects}
          onSelectProject={handleSelectProject}
          onOpenGuardrails={() => setShowGuardrailsModal(true)}
          onRefreshProjects={handleRefreshProjects}
          onScreenCandidate={handleScreenCandidate}
        />
      </div>

      {/* Hiring Guardrails Modal */}
      {showGuardrailsModal && (
        <JobGuardrailsModal
          isOpen={showGuardrailsModal}
          onClose={() => setShowGuardrailsModal(false)}
          project={activeProject}
          onSave={handleSaveGuardrails}
        />
      )}

      {/* Create New Job Project Modal */}
      {showNewJobModal && (
        <NewJobModal
          isOpen={showNewJobModal}
          onClose={() => setShowNewJobModal(false)}
          onCreate={handleCreateJob}
        />
      )}
    </main>
  );
}

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0c0b0e] text-muted font-mono text-sm">
          Loading RecruiterOS Pipeline...
        </div>
      }
    >
      <PipelineContent />
    </Suspense>
  );
}
