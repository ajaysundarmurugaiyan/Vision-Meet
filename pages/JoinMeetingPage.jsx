import React, { useState, useContext } from 'react';
import { MeetingContext } from '../contexts/MeetingContext';
import { useNavigate, useParams } from 'react-router-dom';

const JoinMeetingPage = () => {
  const { joinMeeting } = useContext(MeetingContext);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { meetingId } = useParams();

  const handleJoinMeeting = async () => {
    if (!userName.trim() || !meetingId) {
      setError('Please enter your name and ensure the meeting ID is valid.');
      return;
    }
    setIsLoading(true);
    setError(null);
    const userId = Math.random().toString(36).substring(2, 15);
    const success = await joinMeeting(userName, userId, meetingId);
    setIsLoading(false);
    if (success) {
      navigate(`/waiting-room/${meetingId}`);
    } else {
      setError('Failed to join the meeting. Please check the ID and try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 sm:p-6">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 transition-all duration-300 hover:shadow-blue-900/20">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Join Meeting</h1>
          <p className="text-gray-400 text-sm">Enter your details to enter the lobby</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-xl text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 ml-1">Display Name</label>
            <input
              type="text"
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 text-white"
            />
          </div>
        </div>

        <button
          onClick={handleJoinMeeting}
          disabled={isLoading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${isLoading
            ? 'bg-blue-600/50 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Join Meeting'
          )}
        </button>
      </div>
    </div>
  );
};

export default JoinMeetingPage;
