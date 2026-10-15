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
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-edge/80 bg-[#121118] p-6 shadow-2xl text-[#ece9f0]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-[#ece9f0] transition-colors"
        >
          <Icon.X className="h-5 w-5" />
        </button>

        {successResult ? (
          /* Success Screen */
          <div className="text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Icon.Check className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-bold font-sans text-emerald-400">
              পেমেন্ট সাবমিশন সফল হয়েছে!
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed max-w-sm mx-auto">
              {successResult.message}
            </p>
            <div className="mt-6 rounded-xl border border-edge/60 bg-surface/60 p-4 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Transaction ID:</span>
                <span className="font-bold text-signal">{successResult.record?.trxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">প্ল্যান:</span>
                <span>{planInfo.label} ({planInfo.displayBdt})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">স্ট্যাটাস:</span>
                <span className="text-amber-400 font-semibold">ভেরিফিকেশন পেন্ডিং (২৪ ঘণ্টা প্রভিশনাল প্রো অ্যাক্টিভ)</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="mt-6 w-full rounded-xl bg-signal py-3 font-mono text-sm font-bold text-ink hover:bg-signal/90 transition-all shadow-md"
            >
              প্রো ড্যাশবোর্ডে প্রবেশ করুন →
            </button>
          </div>
        ) : (
          /* Payment Form */
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ea580c]/20 text-[#ea580c] font-bold text-xs border border-[#ea580c]/30">
                ৳
              </span>
              <h2 className="text-lg font-bold font-sans tracking-tight">
                বিকাশ ও নগদ পেমেন্ট (বাংলাদেশী ডেভেলপার)
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              ক্রেডিট কার্ড ছাড়াই সহজে বিকাশ বা নগদে পেমেন্ট করে তাৎক্ষণিক প্রো ফিচার আনলক করুন।
            </p>

            {/* Plan selector */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan('pro_monthly')}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedPlan === 'pro_monthly'
                    ? 'border-signal bg-signal/10 shadow-xs'
                    : 'border-edge bg-surface/50 hover:border-edge/80'
                }`}
              >
                <div className="font-mono text-xs font-semibold text-muted">মাসিক প্রো</div>
                <div className="mt-1 font-sans text-lg font-extrabold text-signal">৳৩৯৯ <span className="text-xs font-normal text-muted">/মাস</span></div>
                <div className="text-[10px] text-muted font-mono mt-0.5">সব ডিপ কোড অডিট ও ইন্টারভিউ ড্রিল</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('pro_annual')}
                className={`rounded-xl border p-3 text-left transition-all relative ${
                  selectedPlan === 'pro_annual'
                    ? 'border-signal bg-signal/10 shadow-xs'
                    : 'border-edge bg-surface/50 hover:border-edge/80'
                }`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300">
                  ২৭% সাশ্রয়ী
                </span>
                <div className="font-mono text-xs font-semibold text-muted">বাৎসরিক প্রো</div>
                <div className="mt-1 font-sans text-lg font-extrabold text-[#ece9f0]">৳৩,৪৯০ <span className="text-xs font-normal text-muted">/বছর</span></div>
                <div className="text-[10px] text-muted font-mono mt-0.5">১ বছরের আনলিমিটেড অ্যাক্সেস</div>
              </button>
            </div>

            {/* Step 1: Send Money Box */}
            <div className="mt-5 rounded-xl border border-edge/80 bg-surface/80 p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                <span>১. টাকা পাঠান ({planInfo.displayBdt})</span>
                {/* Method selector pills */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProvider('bkash')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all ${
                      provider === 'bkash'
                        ? 'bg-[#e2136e] text-white shadow-xs'
                        : 'bg-edge/40 text-muted hover:text-white'
                    }`}
                  >
                    বিকাশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('nagad')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all ${
                      provider === 'nagad'
                        ? 'bg-[#f7941d] text-white shadow-xs'
                        : 'bg-edge/40 text-muted hover:text-white'
                    }`}
                  >
                    নগদ
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('rocket')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all ${
                      provider === 'rocket'
                        ? 'bg-[#8c3494] text-white shadow-xs'
                        : 'bg-edge/40 text-muted hover:text-white'
                    }`}
                  >
                    রকেট
                  </button>
                </div>
              </div>

              {/* Number and copy button */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-edge bg-ink/70 px-3.5 py-2.5">
                <div>
                  <div className="text-xs text-muted font-mono">{provider.toUpperCase()} {activeAccount.type} নম্বর:</div>
                  <div className="text-base font-bold font-mono text-[#ece9f0] tracking-wider mt-0.5">
                    {activeAccount.number}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="rounded-lg border border-edge/80 bg-surface/80 px-3 py-1.5 font-mono text-xs font-semibold hover:border-signal/60 transition-all flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Icon.Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Icon.Copy className="h-3.5 w-3.5 text-muted" />
                      <span>কপি নম্বর</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-muted leading-tight">
                💡 বিকাশ/নগদ অ্যাপে গিয়ে <strong>Send Money</strong> করুন। রেফারেন্সে আপনার নাম বা গিটহাব হ্যান্ডেল দিন।
              </div>
            </div>

            {/* Step 2: Form submission */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                ২. ট্রানজেকশন তথ্য দিন
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1">
                    যে নম্বর থেকে পাঠিয়েছেন:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full rounded-lg border border-edge bg-surface/90 px-3 py-2 font-mono text-xs text-[#ece9f0] placeholder:text-muted/60 focus:border-signal focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1">
                    Transaction ID (TrxID):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BJC7A98DF2"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full rounded-lg border border-edge bg-surface/90 px-3 py-2 font-mono text-xs text-[#ece9f0] uppercase placeholder:text-muted/60 focus:border-signal focus:outline-hidden"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-signal py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink hover:bg-signal/90 transition-all shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon.Spinner className="h-4 w-4 animate-spin" />
                    <span>সাবমিট হচ্ছে...</span>
                  </>
                ) : (
                  <span>সাবমিট ও তাৎক্ষণিক প্রো আনলক করুন ⚡</span>
                )}
              </button>

              <div className="text-[11px] text-center text-muted font-mono">
                ✨ ট্রানজেকশন সাবমিট করলেই <strong>২৪ ঘণ্টার তাৎক্ষণিক প্রো ট্রায়াল</strong> চালু হবে।
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
