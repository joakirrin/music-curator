// src/components/chat/VerificationProgress.tsx
import { Loader2, CheckCircle } from "lucide-react";

type Props = {
  total: number;
  verified: number;
  failed: number;
  isComplete?: boolean;
};

export default function VerificationProgress({ total, verified, failed, isComplete }: Props) {
  const current = verified + failed;
  const percentage = (current / total) * 100;

  if (isComplete) {
    return (
      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex items-start gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-medium text-emerald-400">
              Verification Complete
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ✅ {verified} verified
              {failed > 0 && <span className="text-orange-400"> • ⚠️ {failed} needs checking</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
      <div className="flex items-start gap-2 mb-2">
        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-xs font-medium text-yellow-400">
            Verifying songs... {current}/{total}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            ✅ {verified} verified
            {failed > 0 && <span className="text-orange-400"> • ⚠️ {failed} failed</span>}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
