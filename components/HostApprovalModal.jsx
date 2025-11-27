import React from 'react';

const HostApprovalModal = ({ isOpen, onClose, waitingParticipants, onApprove, onDeny }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 id="approval-modal-title" className="text-xl font-semibold text-blue-300">Waiting Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close waiting room modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {waitingParticipants.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No users are currently waiting for approval.</p>
        ) : (
          <ul className="space-y-3 overflow-y-auto flex-grow">
            {waitingParticipants.map((p) => (
              <li key={p.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                <span className="text-gray-200">{p.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => onApprove(p)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                  >
                    Admit
                  </button>
                  <button
                    onClick={() => onDeny(p.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-4">Waiting participants are synced with the meeting database.</p>
      </div>
    </div>
  );
};

export default HostApprovalModal;
