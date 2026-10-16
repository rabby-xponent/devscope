'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { ConfirmModal, AlertModal, TextArea } from '@/components/ui';
import {
  AdminMfsRecord,
  fetchAdminMfsPayments,
  verifyAdminMfsPayment,
  PLANS,
} from '@/lib/billing';

export default function AdminBillingPage() {
  const [payments, setPayments] = useState<AdminMfsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_verification' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectModalRecord, setRejectModalRecord] = useState<AdminMfsRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentToApprove, setPaymentToApprove] = useState<AdminMfsRecord | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; description: string; variant?: 'error' | 'info' | 'warning' } | null>(null);

  // Load saved admin key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gitgrill_admin_key') || localStorage.getItem('devscope_admin_key');
    if (saved) setAdminKey(saved);
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMfsPayments(
        statusFilter === 'all' ? undefined : statusFilter,
        adminKey || undefined
      );
      setPayments(data.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, adminKey]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleSaveAdminKey = (newKey: string) => {
    setAdminKey(newKey);
    localStorage.setItem('gitgrill_admin_key', newKey);
    setShowKeyInput(false);
  };

  const handleCopyTrx = (trxId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedTrxId(trxId);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  const handleApprove = (record: AdminMfsRecord) => {
    setPaymentToApprove(record);
  };

  const handleExecuteApprove = async () => {
    if (!paymentToApprove) return;
    const record = paymentToApprove;
    setActionInProgress(record.id);
    try {
      await verifyAdminMfsPayment(record.id, 'approve', undefined, adminKey || undefined);
      await loadPayments();
      setPaymentToApprove(null);
    } catch (err: any) {
      setAlertInfo({ title: 'Approval Failed', description: err?.message || 'Server error', variant: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRecord) return;
    setActionInProgress(rejectModalRecord.id);
    try {
      await verifyAdminMfsPayment(
        rejectModalRecord.id,
        'reject',
        rejectReason.trim() || 'Payment details could not be verified.',
        adminKey || undefined
      );
      setRejectModalRecord(null);
      setRejectReason('');
      await loadPayments();
    } catch (err: any) {
      setAlertInfo({ title: 'Rejection Failed', description: err?.message || 'Server error', variant: 'error' });
    } finally {
      setActionInProgress(null);
    }
  };

  // Filtered list by search term
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.trxId.toLowerCase().includes(q) ||
        p.senderNumber.includes(q) ||
        (p.userHandle && p.userHandle.toLowerCase().includes(q)) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(q)) ||
        p.provider.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  // Metric counts
  const metrics = useMemo(() => {
    const pending = payments.filter((p) => p.status === 'pending_verification').length;
    const verified = payments.filter((p) => p.status === 'verified').length;
    const rejected = payments.filter((p) => p.status === 'rejected').length;
    const totalBdt = payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + (p.amountBdt || 0), 0);

    return { total: payments.length, pending, verified, rejected, totalBdt };
  }, [payments]);

  return (
    <div className="min-h-screen bg-canvas text-content">
      {/* Top Navigation Bar */}
      <header className="border-b border-edge bg-card sticky top-0 z-30 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/developer"
              className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-content transition-colors"
            >
              <Icon.ArrowLeft className="h-3.5 w-3.5" />
              <span>Developer Workspace</span>
            </Link>
            <span className="text-edge">/</span>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#ea580c]/15 text-[#ea580c] font-mono font-bold text-xs">
                ৳
              </span>
              <h1 className="font-sans text-sm font-bold tracking-tight text-content">
                MFS Payment Admin
              </h1>
              <span className="rounded bg-well px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted border border-edge">
                Bangladesh Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyInput((v) => !v)}
              className="rounded-lg border border-edge bg-well px-3 py-1.5 font-mono text-xs text-muted hover:text-content transition-colors flex items-center gap-1.5"
            >
              <Icon.Lock className="h-3 w-3" />
              <span>{adminKey ? 'Key Configured' : 'Set Admin Key'}</span>
            </button>

            <button
              type="button"
              onClick={loadPayments}
              disabled={loading}
              className="rounded-lg border border-edge bg-well px-3 py-1.5 font-mono text-xs text-content hover:bg-card transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon.Refresh className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Key Drawer */}
      {showKeyInput && (
        <div className="border-b border-edge bg-well/60 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center gap-3">
            <label className="font-mono text-xs text-muted whitespace-nowrap">
              Admin Secret Key:
            </label>
            <input
              type="password"
              placeholder="Enter ADMIN_SECRET_KEY"
              defaultValue={adminKey}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveAdminKey((e.target as HTMLInputElement).value.trim());
                }
              }}
              className="rounded-lg border border-edge bg-card px-3 py-1 font-mono text-xs text-content w-64 focus:border-signal focus:outline-hidden"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleSaveAdminKey(input.value.trim());
              }}
              className="rounded-lg bg-signal text-white px-3 py-1 font-mono text-xs font-bold"
            >
              Save Key
            </button>
            <button
              type="button"
              onClick={() => handleSaveAdminKey('')}
              className="text-muted hover:text-rose-500 font-mono text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border border-edge bg-card p-4 shadow-xs">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Total Submissions
            </div>
            <div className="mt-1 font-sans text-2xl font-bold text-content">
              {metrics.total}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
            <div className="font-mono text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
              Pending Verification
            </div>
            <div className="mt-1 font-sans text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.pending}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              Verified Pro
            </div>
            <div className="mt-1 font-sans text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.verified}
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-xs">
            <div className="font-mono text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">
              Rejected
            </div>
            <div className="mt-1 font-sans text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.rejected}
            </div>
          </div>

          <div className="rounded-xl border border-edge bg-card p-4 shadow-xs col-span-2 md:col-span-1">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Verified Revenue
            </div>
            <div className="mt-1 font-sans text-2xl font-bold text-content">
              ৳{metrics.totalBdt.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-xl border border-edge bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1.5 bg-well p-1 rounded-lg border border-edge">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pending_verification', label: `Pending (${metrics.pending})` },
                { id: 'verified', label: 'Verified' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-card text-content shadow-xs'
                    : 'text-muted hover:text-content'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2 rounded-lg border border-edge bg-well px-3 py-1.5 w-full sm:w-72">
            <Icon.Search className="h-3.5 w-3.5 text-muted flex-none" />
            <input
              type="text"
              placeholder="Search TrxID, phone, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent font-mono text-xs text-content outline-none w-full placeholder:text-muted/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted hover:text-content"
              >
                <Icon.X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 font-mono text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Payments Table */}
        <div className="rounded-2xl border border-edge bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-edge bg-well/70 text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Provider</th>
                  <th className="px-4 py-3.5">Transaction ID</th>
                  <th className="px-4 py-3.5">Amount / Plan</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Sender Phone</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date & Provisional</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted">
                      <Icon.Spinner className="h-5 w-5 animate-spin mx-auto text-muted mb-2" />
                      Loading MFS payments...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((record) => {
                    const planDef = PLANS[record.planId] || { label: record.planId, displayBdt: `৳${record.amountBdt}` };
                    const isPending = record.status === 'pending_verification';
                    const isBusy = actionInProgress === record.id;
                    const date = new Date(record.createdAt);

                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors hover:bg-well/40 ${
                          isPending ? 'bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        {/* Provider */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white uppercase ${
                              record.provider === 'bkash'
                                ? 'bg-[#e2136e]'
                                : record.provider === 'nagad'
                                  ? 'bg-[#f7941d]'
                                  : 'bg-[#8c3494]'
                            }`}
                          >
                            {record.provider}
                          </span>
                        </td>

                        {/* TrxID */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-content tracking-wider">
                              {record.trxId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTrx(record.trxId)}
                              title="Copy TrxID"
                              className="text-muted hover:text-content p-1 rounded hover:bg-well"
                            >
                              {copiedTrxId === record.trxId ? (
                                <Icon.Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Icon.Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-bold text-content">
                            ৳{record.amountBdt}
                          </div>
                          <div className="text-[10px] text-muted">
                            {planDef.label}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-content truncate max-w-[140px]">
                            {record.userHandle ? `@${record.userHandle}` : record.userEmail || record.userId.slice(0, 10)}
                          </div>
                          {record.userEmail && record.userHandle && (
                            <div className="text-[10px] text-muted truncate max-w-[140px]">
                              {record.userEmail}
                            </div>
                          )}
                        </td>

                        {/* Sender Phone */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-content">
                          {record.senderNumber}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {record.status === 'verified' && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <Icon.Check className="h-2.5 w-2.5" />
                              Verified
                            </span>
                          )}
                          {record.status === 'pending_verification' && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {record.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              <Icon.X className="h-2.5 w-2.5" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Date & Provisional Access */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-muted">
                          <div>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {record.status === 'pending_verification' && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400">
                              Provisional active
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleApprove(record)}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold transition-all disabled:opacity-50"
                              >
                                {isBusy ? '...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setRejectModalRecord(record)}
                                className="rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted">
                              {record.verifiedAt ? `Processed ${new Date(record.verifiedAt).toLocaleDateString()}` : 'Completed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {rejectModalRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setRejectModalRecord(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fade-up relative w-full max-w-md rounded-2xl border border-edge bg-card p-6 shadow-pop text-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <h3 className="font-sans font-bold text-sm text-content">
                Reject Transaction
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalRecord(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge bg-well/50 text-muted transition-colors hover:border-signal/50 hover:bg-well hover:text-signal"
              >
                <Icon.X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="rounded-lg border border-edge bg-well p-3 space-y-1">
                <div>TrxID: <span className="font-bold text-content">{rejectModalRecord.trxId}</span></div>
                <div>Sender: <span className="text-content">{rejectModalRecord.senderNumber}</span></div>
                <div>Amount: <span className="text-content">৳{rejectModalRecord.amountBdt}</span></div>
              </div>

              <div>
                <label className="block text-[11px] text-muted mb-1 font-mono uppercase tracking-wider">
                  Reason for rejection (saved to record):
                </label>
                <TextArea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction ID not found in MFS statement, or incorrect amount."
                  mono
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalRecord(null)}
                  className="rounded-lg border border-edge px-3 py-1.5 text-muted hover:text-content"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionInProgress === rejectModalRecord.id}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 font-bold transition-all disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Payment Confirm Modal */}
      {paymentToApprove && (
        <ConfirmModal
          isOpen={!!paymentToApprove}
          onClose={() => setPaymentToApprove(null)}
          onConfirm={handleExecuteApprove}
          title="Approve MFS Payment?"
          description={
            <div className="space-y-2 font-sans text-xs">
              <p>
                Verify transaction <strong className="font-mono text-content">{paymentToApprove.trxId}</strong> from <strong>{paymentToApprove.senderNumber}</strong> ({paymentToApprove.amountBdt} BDT)?
              </p>
              <div className="rounded-xl border border-signal/20 bg-signal/10 p-3 text-signal">
                <p className="font-semibold">Grant Full Pro Subscription</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  This will upgrade user <span className="font-mono">{paymentToApprove.userEmail}</span> to the Pro tier immediately.
                </p>
              </div>
            </div>
          }
          confirmLabel="Approve Payment"
          variant="info"
        />
      )}

      {/* Alert Modal */}
      {alertInfo && (
        <AlertModal
          isOpen={!!alertInfo}
          onClose={() => setAlertInfo(null)}
          title={alertInfo.title}
          description={alertInfo.description}
          variant={alertInfo.variant}
        />
      )}
    </div>
  );
}
