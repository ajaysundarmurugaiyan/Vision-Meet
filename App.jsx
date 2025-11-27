import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MeetingContext, MeetingProvider } from './contexts/MeetingContext';
import HomePage from './pages/HomePage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import MeetingPage from './pages/MeetingPage';
import JoinMeetingPage from './pages/JoinMeetingPage';

const AppContent = () => {
  const { state } = useContext(MeetingContext);
  
  if (!state.meetingId || !state.userId) {
    return <HomePage />;
  }

  const currentUserIsParticipant = state.participants.some(p => p.id === state.userId);
  
  if (state.meetingId && state.userId && !currentUserIsParticipant && !state.isHost) {
    // Check if user is in waitingParticipants list
    const isWaiting = state.waitingParticipants.some(wp => wp.id === state.userId);
    
    if (isWaiting) {
      return <WaitingRoomPage />;
    }
    
    // If not waiting and not participant, implies they tried to join an invalid/ended meeting or were denied.
    // Or they haven't initiated the join request through the UI yet.
    // For simplicity, if meetingId is set but user not participant & not host & not waiting, send to home.
    // A more robust system might show an error or a specific "denied" page.
    return <HomePage />; // Or a dedicated "Join Error" page
  }

  return <MeetingPage />;
};

const App = () => {
  return (
    <HashRouter>
      <MeetingProvider>
        <div className="h-screen w-screen bg-gray-800 text-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/waiting-room/:meetingId" element={<WaitingRoomPage />} />
            <Route path="/meeting/:meetingId" element={<MeetingPage />} />
            <Route path="/join/:meetingId" element={<JoinMeetingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </MeetingProvider>
    </HashRouter>
  );
};

export default App;
