import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { subscribeToViolations } from '../lib/webhookHandler';

interface Violation {
  id: string;
  page_id: string;
  post_id: string | null;
  comment_id: string | null;
  content: string;
  violation_type: string;
  confidence: number;
  created_at: string;
}

function ViolationAlert() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Subscribe to new violations
    const unsubscribe = subscribeToViolations((violation) => {
      setViolations(prev => [violation, ...prev].slice(0, 5));
      setShowAlert(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const dismissAlert = () => {
    setShowAlert(false);
  };

  if (!showAlert || violations.length === 0) {
    return null;
  }

  const latestViolation = violations[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-red-50 border border-red-200 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-700">
                Phát hiện vi phạm nội dung
              </h3>
              <p className="text-sm text-red-600 mt-1">
                Loại vi phạm: {latestViolation.violation_type || 'Không xác định'}
              </p>
            </div>
          </div>
          <button 
            onClick={dismissAlert}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-3 p-3 bg-white rounded border border-red-100">
          <p className="text-sm text-gray-700">{latestViolation.content}</p>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-red-600">
            Độ tin cậy: {Math.round(latestViolation.confidence * 100)}%
          </span>
          <button className="text-xs text-blue-600 hover:underline">
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViolationAlert;