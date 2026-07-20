import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Clock, CheckCircle2, FileText } from 'lucide-react';
import RequestAccessModal from '../components/RequestAccessModal';

export default function Pending() {
  const { user, logout, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if user already submitted their application (has a role set)
  const hasApplied = !!user?.role;

  const handleSuccess = async () => {
    setShowModal(false);
    setSubmitted(true);
    await refreshUser();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 p-4">
      {showModal && (
        <RequestAccessModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="w-full max-w-lg bg-white dark:bg-[#1a1d27] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Progress indicator */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-700 ease-out"
            style={{ width: hasApplied || submitted ? '66%' : '33%' }}
          />
        </div>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
            hasApplied || submitted
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }`}>
            {hasApplied || submitted ? (
              <CheckCircle2 size={36} />
            ) : (
              <Clock size={36} />
            )}
          </div>

          {/* Title & message */}
          <h2 className="text-2xl font-bold mb-3 font-serif">
            {hasApplied || submitted ? 'Application Submitted' : 'Complete Your Application'}
          </h2>

          {hasApplied || submitted ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Thank you, <strong>{user?.username}</strong>! Your application has been received and is under review by our admin team. You'll gain access once approved.
              </p>

              {/* Application summary */}
              <div className="bg-gray-50 dark:bg-[#13151f] rounded-2xl p-5 text-left space-y-3 mt-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Application Summary</div>
                {user?.role && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                      <FileText size={14} />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400">Role</div>
                      <div className="text-sm font-semibold capitalize text-black dark:text-white">{user.role}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                    <FileText size={14} />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">Requested Tier</div>
                    <div className="text-sm font-semibold text-black dark:text-white">Tier {user?.payment_tier}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Pending admin review
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Welcome, <strong>{user?.username}</strong>! Your account has been created. To complete your registration, please submit your role, preferred tier, and verification document.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3.5 px-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-base"
              >
                Complete Application →
              </button>
            </div>
          )}

          <button
            onClick={logout}
            className="mt-6 w-full py-3 px-4 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-2xl hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
