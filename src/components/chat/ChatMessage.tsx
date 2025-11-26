// src/components/chat/ChatMessage.tsx
// Chat message component with Fonea-styled bubbles, verification progress, and cancel button

import { Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessage;
  onCancelVerification?: (messageId: string) => void;
}

export function ChatMessage({ message, onCancelVerification }: ChatMessageProps) {
  const isVerifying = message.verificationStatus === 'in_progress';
  const isCancelled = message.verificationStatus === 'cancelled';
  const isTimeout = message.verificationStatus === 'timeout';
  const isComplete = message.verificationStatus === 'complete';
  
  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-bubble">
        {/* Message content */}
        <div className="message-content">
          {message.content}
        </div>
        
        {/* Verification Progress Section */}
        {message.verificationProgress && (
          <div className="verification-section">
            
            {/* In Progress State */}
            {isVerifying && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Verifying songs... {message.verificationProgress.verified}/{message.verificationProgress.total} verified
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(message.verificationProgress.verified / message.verificationProgress.total) * 100}%` 
                    }}
                  />
                </div>
                
                {/* Cancel Button */}
                {onCancelVerification && (
                  <button
                    onClick={() => onCancelVerification(message.id)}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Cancel verification
                  </button>
                )}
              </div>
            )}
            
            {/* Cancelled State */}
            {isCancelled && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Verification cancelled. Kept {message.verificationProgress.verified}/{message.verificationProgress.total} verified songs.
                </span>
              </div>
            )}
            
            {/* Timeout State */}
            {isTimeout && (
              <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Verification timed out after {message.verificationTimeoutSeconds || 30}s. 
                  Kept {message.verificationProgress.verified}/{message.verificationProgress.total} verified songs.
                </span>
              </div>
            )}
            
            {/* Complete State */}
            {isComplete && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {message.verificationProgress.verified}/{message.verificationProgress.total} songs verified
                  {message.verificationProgress.failed > 0 && ` (${message.verificationProgress.failed} failed)`}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Auto-Replacement Progress Section */}
        {message.replacementStatus && (
          <div className="replacement-section">
            
            {/* Requesting Replacements */}
            {message.replacementStatus === 'requesting' && (
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-pulse" />
                <span>
                  🤖 Getting replacements (attempt {message.replacementAttempt}/3)...
                </span>
              </div>
            )}
            
            {/* Verifying Replacements */}
            {message.replacementStatus === 'verifying' && (
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  🔍 Verifying replacements (attempt {message.replacementAttempt}/3)...
                </span>
              </div>
            )}
            
            {/* Replacement Complete */}
            {message.replacementStatus === 'complete' && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>✅ All failed songs replaced!</span>
              </div>
            )}
            
            {/* Replacement Failed */}
            {message.replacementStatus === 'failed' && (
              <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  ⚠️ Some songs couldn't be replaced after {message.replacementAttempt} attempts
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
