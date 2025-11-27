import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingContext } from '../contexts/MeetingContext';

const WaitingRoomPage = () => {
  const { state, dispatch } = useContext(MeetingContext);
  const navigate = useNavigate();
  
  const handleCancelJoin = () => {
    dispatch({ type: 'LEAVE_MEETING' });
  };

  useEffect(() => {
    if (!state.meetingId || !state.userId) return;
    const hasAccess = state.participants.some(p => p.id === state.userId);
    if (hasAccess) {
      navigate(`/meeting/${state.meetingId}`);
    }
  }, [state.meetingId, state.userId, state.participants, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 md:p-12 rounded-lg shadow-xl text-center w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">VisionMeet</h1>
        
        <p className="text-xl mb-2">
          Hello, <span className="font-semibold">{state.userName || 'Guest'}</span>!
        </p>
        <p className="text-lg mb-8 text-gray-300">
          You are trying to join meeting: <span className="font-medium text-gray-100">{state.meetingId || '...'}</span>
        </p>
        
        <div className="my-8">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        
        <p className="text-2xl font-semibold mb-3 text-gray-100">Waiting for Host Approval...</p>
        <p className="text-gray-400 mb-8">The host has been notified. Please wait for them to let you in.</p>
        
        <button
          onClick={handleCancelJoin}
          className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition duration-150 ease-in-out"
        >
          Cancel Request
        </button>
      </div>
    </div>
  );
};

export default WaitingRoomPage;
