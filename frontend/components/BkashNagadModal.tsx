'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { PLANS, PlanId, submitMfsPayment, fetchMfsStatus, MfsProvider } from '@/lib/billing';
import { useSession } from '@/components/SessionProvider';

interface BkashNagadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: PlanId;
  onSuccess?: () => void;
}

export function BkashNagadModal({
  isOpen,
  onClose,
  defaultPlan = 'pro_monthly',
  onSuccess,
}: BkashNagadModalProps) {
  const { user } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(defaultPlan);
  const [provider, setProvider] = useState<MfsProvider>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [accounts, setAccounts] = useState({
    bkash: { number: '01711-000000', type: 'Personal', note: 'Send Money অপশন ব্যবহার করুন' },
    nagad: { number: '01811-000000', type: 'Personal', note: 'Send Money অপশন ব্যবহার করুন' },
    rocket: { number: '01911-000000', type: 'Personal', note: 'Send Money অপশন ব্যবহার করুন' },
  });

  useEffect(() => {
    if (isOpen) {
      fetchMfsStatus().then((res) => {
        if (res?.accounts) {
          setAccounts(res.accounts as any);
        }
      });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const planInfo = PLANS[selectedPlan];
  const activeAccount = accounts[provider] || accounts.bkash;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(activeAccount.number.replace(/[^\d]/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderNumber.trim() || !trxId.trim()) {
      setError('মোবাইল নম্বর ও Transaction ID (TrxID) উভয়ই পূরণ করুন।');
      return;
    }

    setLoading(true);
    try {
      const res = await submitMfsPayment({
        provider,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim(),
        planId: selectedPlan,
        userHandle: user?.handle || undefined,
        userEmail: user?.email || undefined,
      });

      setSuccessResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'সাবমিশন ব্যর্থ হয়েছে। দয়া করে সঠিক তথ্য দিন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fade-up relative w-full max-w-lg rounded-2xl border border-edge bg-card p-6 shadow-pop text-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title & Close Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ea580c]/30 bg-[#ea580c]/10 text-[#ea580c] font-mono font-bold text-xs">
              ৳
            </span>
            <div>
              <h2 className="text-base font-bold font-sans tracking-tight text-content">
                বিকাশ ও নগদ পেমেন্ট
              </h2>
              <p className="font-mono text-[11px] text-muted">
                বাংলাদেশী ডেভেলপার ও টিম অ্যাক্সেস
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge bg-well/50 text-muted transition-colors hover:border-signal/50 hover:bg-well hover:text-signal"
          >
            <Icon.X className="h-3.5 w-3.5" />
          </button>
        </div>

        {successResult ? (
          /* Success Screen */
          <div className="text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Icon.Check className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400">
              পেমেন্ট সাবমিশন সফল হয়েছে
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed max-w-sm mx-auto">
              {successResult.message}
            </p>
            <div className="mt-6 rounded-xl border border-edge bg-well p-4 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Transaction ID:</span>
                <span className="font-bold text-[#ea580c]">{successResult.record?.trxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">প্ল্যান:</span>
                <span className="text-content font-medium">{planInfo.label} ({planInfo.displayBdt})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">স্ট্যাটাস:</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">ভেরিফিকেশন পেন্ডিং (২৪ ঘণ্টা প্রভিশনাল অ্যাক্সেস সক্রিয়)</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="mt-6 w-full rounded-xl bg-[#ea580c] hover:bg-[#c2410c] py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md"
            >
              ড্যাশবোর্ডে ফিরে যান →
            </button>
          </div>
        ) : (
          /* Payment Form */
          <div className="mt-4">
            <p className="text-xs text-muted leading-relaxed">
              ক্রেডিট কার্ড ছাড়াই সরাসরি বিকাশ, নগদ বা রকেটে পেমেন্ট করে প্রো অ্যাকাউন্ট অ্যাক্টিভ করুন।
            </p>

            {/* Plan selector */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedPlan('pro_monthly')}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  selectedPlan === 'pro_monthly'
                    ? 'border-[#ea580c] bg-[#ea580c]/10 shadow-xs'
                    : 'border-edge bg-well hover:border-edge/80'
                }`}
              >
                <div className="font-mono text-xs font-semibold text-muted">মাসিক প্রো</div>
                <div className="mt-1 font-sans text-lg font-extrabold text-content">
                  ৳৩৯৯ <span className="text-xs font-normal text-muted">/মাস</span>
                </div>
                <div className="text-[11px] text-muted font-mono mt-0.5">ডিপ কোড অডিট ও ড্রিল</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('pro_annual')}
                className={`rounded-xl border p-3.5 text-left transition-all relative ${
                  selectedPlan === 'pro_annual'
                    ? 'border-[#ea580c] bg-[#ea580c]/10 shadow-xs'
                    : 'border-edge bg-well hover:border-edge/80'
                }`}
              >
                <span className="absolute -top-2 right-2 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ২৭% সাশ্রয়ী
                </span>
                <div className="font-mono text-xs font-semibold text-muted">বাৎসরিক প্রো</div>
                <div className="mt-1 font-sans text-lg font-extrabold text-content">
                  ৳৩,৪৯০ <span className="text-xs font-normal text-muted">/বছর</span>
                </div>
                <div className="text-[11px] text-muted font-mono mt-0.5">১ বছরের আনলিমিটেড</div>
              </button>
            </div>

            {/* Step 1: Send Money Box */}
            <div className="mt-4 rounded-xl border border-edge bg-well/70 p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-content flex items-center justify-between">
                <span>১. টাকা পাঠান ({planInfo.displayBdt})</span>
                {/* Method selector pills */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProvider('bkash')}
                    className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                      provider === 'bkash'
                        ? 'bg-[#e2136e] text-white shadow-xs'
                        : 'border border-edge bg-card text-muted hover:text-content'
                    }`}
                  >
                    বিকাশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('nagad')}
                    className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                      provider === 'nagad'
                        ? 'bg-[#f7941d] text-white shadow-xs'
                        : 'border border-edge bg-card text-muted hover:text-content'
                    }`}
                  >
                    নগদ
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('rocket')}
                    className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                      provider === 'rocket'
                        ? 'bg-[#8c3494] text-white shadow-xs'
                        : 'border border-edge bg-card text-muted hover:text-content'
                    }`}
                  >
                    রকেট
                  </button>
                </div>
              </div>

              {/* Number and copy button Well */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-edge bg-card px-4 py-3 shadow-xs">
                <div>
                  <div className="text-[11px] text-muted font-mono uppercase tracking-wider">
                    {provider.toUpperCase()} ({activeAccount.type}) নম্বর
                  </div>
                  <div className="text-lg font-bold font-mono text-content tracking-wider mt-0.5 select-all">
                    {activeAccount.number}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="rounded-lg border border-edge bg-well hover:bg-card px-3 py-1.5 font-mono text-xs font-medium text-content transition-colors flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Icon.Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Icon.Copy className="h-3.5 w-3.5 text-muted" />
                      <span>কপি নম্বর</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-muted leading-normal">
                বিকাশ বা নগদ অ্যাপ থেকে <strong>Send Money</strong> করুন। রেফারেন্সে আপনার গিটহাব ইউজারনেম দিন।
              </div>
            </div>

            {/* Step 2: Form submission */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-content">
                ২. ট্রানজেকশন তথ্য দিন
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1">
                    প্রেরক মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full rounded-lg border border-edge bg-well px-3 py-2 font-mono text-xs text-content placeholder:text-muted/60 focus:border-[#ea580c] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BJC7A98DF2"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full rounded-lg border border-edge bg-well px-3 py-2 font-mono text-xs text-content uppercase placeholder:text-muted/60 focus:border-[#ea580c] focus:outline-hidden"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-300 font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#ea580c] hover:bg-[#c2410c] py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon.Spinner className="h-4 w-4 animate-spin" />
                    <span>যাচাই হচ্ছে...</span>
                  </>
                ) : (
                  <span>সাবমিট ও পেমেন্ট নিশ্চিত করুন</span>
                )}
              </button>

              <div className="text-[11px] text-center text-muted font-mono">
                ট্রানজেকশন সাবমিট করার পর ম্যানুয়াল ভেরিফিকেশন চলাকালীন ২৪ ঘণ্টার প্রভিশনাল অ্যাক্সেস পাবেন।
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
