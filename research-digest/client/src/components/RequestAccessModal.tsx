import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, Loader2, User, Briefcase, GraduationCap, Users, Zap, Star, Crown, FileText, AlertCircle } from 'lucide-react';
import { api } from '../api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES = [
  { value: 'student', label: 'Student', icon: <GraduationCap size={20} />, desc: 'University / College researcher' },
  { value: 'professional', label: 'Working Professional', icon: <Briefcase size={20} />, desc: 'Industry or corporate researcher' },
  { value: 'researcher', label: 'Academic Researcher', icon: <User size={20} />, desc: 'Post-doc, PhD, faculty member' },
  { value: 'others', label: 'Others', icon: <Users size={20} />, desc: 'Independent or other purpose' },
];

const TIERS = [
  {
    value: 1,
    label: 'Tier 1 — Basic',
    icon: <Zap size={18} />,
    price: 'Free',
    features: ['Digest browsing', 'Explore feed', 'Library access', '5 AI queries/month'],
  },
  {
    value: 2,
    label: 'Tier 2 — Pro',
    icon: <Star size={18} />,
    price: '$9 / mo',
    features: ['Everything in Basic', 'Unlimited AI chat', 'Custom RSS feeds', 'Analytics dashboard'],
    recommended: true,
  },
  {
    value: 3,
    label: 'Tier 3 — Enterprise',
    icon: <Crown size={18} />,
    price: '$29 / mo',
    features: ['Everything in Pro', 'Priority support', 'API access', 'Team collaboration'],
  },
];

export default function RequestAccessModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState('');
  const [tier, setTier] = useState<number>(2);
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return; }
      setFile(f);
      setError('');
    }
  };

  const canProceedStep1 = !!role;
  const canProceedStep2 = !!tier;
  const canSubmit = reason.trim().length >= 20 && !!file;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('role', role);
      formData.append('payment_tier', String(tier));
      formData.append('reason', reason.trim());
      formData.append('gov_id', file!);
      await api.post('/admin/request-access', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#13151f] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-7">
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700'}`}>1</span>
              <div className={`flex-1 h-px ${step >= 2 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>2</span>
              <div className={`flex-1 h-px ${step >= 3 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>3</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-black dark:text-white">
              {step === 1 && 'What describes you?'}
              {step === 2 && 'Choose your access tier'}
              {step === 3 && 'Final details'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === 1 && 'Select the role that best describes your use case'}
              {step === 2 && 'Select the service level you need — admin will verify payment'}
              {step === 3 && 'Tell us why you need access and upload your government ID'}
            </p>
          </div>

          {/* Step 1 — Role */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.98] ${
                    role === r.value
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={role === r.value ? 'text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}>
                    {r.icon}
                  </span>
                  <div>
                    <div className="font-bold text-sm">{r.label}</div>
                    <div className={`text-[11px] mt-0.5 ${role === r.value ? 'opacity-70' : 'text-gray-400'}`}>{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Tier */}
          {step === 2 && (
            <div className="space-y-3">
              {TIERS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTier(t.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.99] relative ${
                    tier === t.value
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t.recommended && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Recommended
                    </span>
                  )}
                  <span className={`mt-0.5 ${tier === t.value ? 'text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{t.label}</span>
                      <span className={`text-xs font-bold shrink-0 ${tier === t.value ? 'opacity-80' : 'text-gray-500'}`}>{t.price}</span>
                    </div>
                    <ul className={`mt-1.5 space-y-0.5 ${tier === t.value ? 'opacity-75' : 'text-gray-400'}`}>
                      {t.features.map(f => (
                        <li key={f} className="text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 size={10} /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3 — Reason + ID */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                  Why do you need access? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe your research goals, intended use of A.R.I.A, and your project or institution (min. 20 characters)..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-all resize-none leading-relaxed"
                />
                <div className="text-xs text-gray-400 mt-1 text-right">{reason.length} / 20+ chars</div>
              </div>

              {/* Gov ID Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                  Government ID <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-400 ml-2">PDF, JPG or PNG — max 10MB</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!file ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-black dark:hover:border-white transition-colors group"
                    type="button"
                  >
                    <Upload size={24} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload</div>
                      <div className="text-xs text-gray-400 mt-0.5">Passport, Driver's License, National ID etc.</div>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-gray-700 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                        <FileText size={18} className="text-white dark:text-black" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold truncate max-w-[220px] text-black dark:text-white">{file.name}</div>
                        <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-between gap-3 mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-80 transition-all disabled:opacity-30 ml-auto"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-80 transition-all disabled:opacity-30 ml-auto"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
