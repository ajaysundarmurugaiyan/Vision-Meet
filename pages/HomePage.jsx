import React, { useState, useContext, useEffect } from 'react';
import { MeetingContext } from '../contexts/MeetingContext';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { createMeeting, joinMeeting, state, dispatch } = useContext(MeetingContext);
  const [userName, setUserName] = useState('');
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('host');
  const navigate = useNavigate();

  useEffect(() => {
    if (state.mediaPermissionError === "You have left the meeting.") {
      dispatch({ type: 'SET_MEDIA_PERMISSION_ERROR', payload: null });
    }
  }, [dispatch, state.mediaPermissionError]);

  const handleCreateMeeting = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsLoading(true);
    setError(null);
    const userId = Math.random().toString(36).substring(2, 15); // Simple random user ID
    const newMeetingId = await createMeeting(userName, userId);
    setIsLoading(false);
    if (newMeetingId) {
      navigate(`/meeting/${newMeetingId}`);
    } else {
      setError('Failed to create meeting. Please try again.');
    }
  };

  const handleJoinMeeting = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!meetingIdInput.trim()) {
      setError('Please enter a meeting ID');
      return;
    }
    setIsLoading(true);
    setError(null);
    const userId = Math.random().toString(36).substring(2, 15);
    const success = await joinMeeting(userName, userId, meetingIdInput.trim());
    setIsLoading(false);
    if (success) {
      navigate(`/waiting-room/${meetingIdInput.trim()}`);
    } else {
      setError('Failed to join meeting. Please check the meeting ID and try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'host') {
      handleCreateMeeting();
    } else {
      handleJoinMeeting();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            VisionMeet
          </h1>
          <p className="text-xl text-gray-300">Connect with crystal-clear video and audio</p>
        </header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Left Side - Form */}
          <div className="lg:w-1/2 w-full">
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
              {/* Tab Toggle */}
              <div className="flex mb-6 bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('host')}
                  className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
                    activeTab === 'host'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Host Meeting
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
                    activeTab === 'join'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Join Meeting
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {activeTab === 'join' && (
                  <div>
                    <label htmlFor="meetingId" className="block text-sm font-medium text-gray-300 mb-2">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      id="meetingId"
                      value={meetingIdInput}
                      onChange={(e) => setMeetingIdInput(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter meeting ID"
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {activeTab === 'host' ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          New Meeting
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Join Meeting
                        </>
                      )}
                    </>
                  )}
                </button>
              </form>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">HD Video</h3>
                  <p className="text-sm text-gray-400 mt-1">Crystal clear video quality</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">Clear Audio</h3>
                  <p className="text-sm text-gray-400 mt-1">Noise cancellation</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">Secure</h3>
                  <p className="text-sm text-gray-400 mt-1">End-to-end encrypted</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white">Scheduling</h3>
                  <p className="text-sm text-gray-400 mt-1">Plan meetings ahead</p>
                </div>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="lg:w-1/2 relative hidden lg:block">
              <div className="relative bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700/50 aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Ready to connect?</h3>
                    <p className="text-gray-400 mt-2">Start or join a meeting to begin</p>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-4 left-4 text-xs text-gray-400">visionmeet.app</div>
              </div>

              {/* Floating avatars */}
              <div className="flex -space-x-3 mt-8 justify-center">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-medium text-sm border-2 border-gray-800"
                  >
                    U{i}
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-medium text-sm border-2 border-gray-800">
                  +12
                </div>
              </div>

              <p className="text-center text-gray-400 mt-4 text-sm">Join thousands of users connecting daily</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p> {new Date().getFullYear()} VisionMeet. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
