// import React from 'react';
// import MicOnIcon from './icons/MicOnIcon';
// import MicOffIcon from './icons/MicOffIcon';
// import VideoOnIcon from './icons/VideoOnIcon';
// import VideoOffIcon from './icons/VideoOffIcon';
// import FolderOpenIcon from './icons/FolderOpenIcon';
// import EndCallIcon from './icons/EndCallIcon';
// import StopShareIcon from './icons/StopShareIcon';

// const ControlButton = ({ onClick, disabled, className = '', children, title }) => (
//   <button
//     title={title}
//     onClick={onClick}
//     disabled={disabled}
//     className={`p-3 rounded-full flex items-center justify-center transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 ${disabled ? 'bg-gray-500 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-600'} ${className}`}
//   >
//     {children}
//   </button>
// );

// const MeetingControls = ({
//   isMicMuted,
//   isCameraOff,
//   isCurrentUserSharing,
//   movieShareDisabled,
//   isUploadingMovie = false,
//   onToggleMic,
//   onToggleCamera,
//   onShareMovie,
//   onStopMovieShare,
//   onLeaveCall,
// }) => {
//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-95 backdrop-blur-sm px-3 sm:px-4 py-3 flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4 z-50">
//       <ControlButton
//         onClick={onToggleMic}
//         className={isMicMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700'}
//         title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
//       >
//         {isMicMuted ? <MicOffIcon className="w-6 h-6 text-white" /> : <MicOnIcon className="w-6 h-6 text-white" />}
//       </ControlButton>

//       <ControlButton
//         onClick={onToggleCamera}
//         className={isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700'}
//         title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
//       >
//         {isCameraOff ? <VideoOffIcon className="w-6 h-6 text-white" /> : <VideoOnIcon className="w-6 h-6 text-white" />}
//       </ControlButton>

//       {isCurrentUserSharing ? (
//          <ControlButton
//             onClick={onStopMovieShare}
//             className="bg-blue-600 hover:bg-blue-700"
//             title="Stop Sharing Movie"
//         >
//             <StopShareIcon className="w-6 h-6 text-white" />
//         </ControlButton>
//       ) : (
//         <ControlButton
//             onClick={onShareMovie}
//             disabled={movieShareDisabled || isUploadingMovie}
//             className={(movieShareDisabled || isUploadingMovie) ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-700'}
//             title={
//               movieShareDisabled
//                 ? "Someone else is sharing"
//                 : isUploadingMovie
//                   ? "Uploading movie..."
//                   : "Share Movie"
//             }
//         >
//             <FolderOpenIcon className="w-6 h-6 text-white" />
//         </ControlButton>
//       )}

//       <ControlButton
//         onClick={onLeaveCall}
//         className="bg-red-600 hover:bg-red-700"
//         title="Leave Call"
//       >
//         <EndCallIcon className="w-6 h-6 text-white" />
//       </ControlButton>
//     </div>
//   );
// };

// export default MeetingControls;


// components/MeetingControls.jsx
import React from 'react';

const MeetingControls = ({
  isMicMuted,
  isCameraOff,
  onToggleMic,
  onToggleCamera,
  onLeaveCall,
  onShareMovie,
  onStopMovieShare,
  isCurrentUserSharing,
  movieShareDisabled,
  isUploadingMovie,
}) => {
  return (
    <div className="bg-gray-800 p-4 flex justify-center space-x-4">
      <button
        onClick={onToggleMic}
        className={`p-3 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-90`}
        title={isMicMuted ? 'Unmute' : 'Mute'}
      >
        {isMicMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11l1 1m0 0l1 1m-1-1l-1 1m1-1l1-1m-9 8a7 7 0 01-7-7v-2m7 9h2m0 0h2m-2 0v-2m0 0h-2m2 0V9m0 0H9m2 0h2m0 0V7a3 3 0 00-3-3m3 3v2m-3 0h2m0 0V7a3 3 0 013-3m0 0h2m-2 0v2m0 0a3 3 0 013 3v2m0 0v2a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-90`}
        title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isCameraOff ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {isCurrentUserSharing ? (
        <button
          onClick={onStopMovieShare}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
          title="Stop sharing"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </button>
      ) : (
        <button
          onClick={onShareMovie}
          disabled={movieShareDisabled || isUploadingMovie}
          className={`p-3 rounded-full ${movieShareDisabled ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          title={movieShareDisabled ? 'Someone else is sharing' : 'Share screen'}
        >
          {isUploadingMovie ? (
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}

      <button
        onClick={onLeaveCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700"
        title="Leave call"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-135" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
};

export default MeetingControls;