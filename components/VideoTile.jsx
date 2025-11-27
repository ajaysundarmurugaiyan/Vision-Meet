import React, { useEffect, useRef } from 'react';
import MicOffIcon from './icons/MicOffIcon';
import VideoOffIcon from './icons/VideoOffIcon';

const VideoTile = ({ participant }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      // Check if srcObject is already set to this stream to avoid unnecessary resets
      if (videoRef.current.srcObject !== participant.stream) {
        videoRef.current.srcObject = participant.stream;
      }
    } else if (videoRef.current && !participant.stream) {
      // Clear the srcObject if the stream is removed
      videoRef.current.srcObject = null;
    }
  }, [participant.stream]);

  // Camera is considered off if explicitly set, or if no stream, or if stream has no enabled video tracks
  const actualCameraOff = participant.isCameraOff ||
                          !participant.stream ||
                          (participant.stream && participant.stream.getVideoTracks().every(track => !track.enabled || track.readyState === 'ended'));
  
  const showOverlayIconPlaceholder = actualCameraOff || !participant.stream;

  return (
    <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-lg flex items-center justify-center w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`w-full h-full object-contain ${showOverlayIconPlaceholder ? 'hidden' : 'block'}`} // Changed object-cover to object-contain
        // Add a key that changes when stream ID changes to force re-render if necessary for some browsers
        key={participant.stream ? participant.stream.id : 'no-stream'}
      />
      {showOverlayIconPlaceholder && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-gray-400">{participant.name.substring(0,1).toUpperCase()}</span>
          </div>
         </div>
      )}
      {/* Explicit VideoOffIcon if camera is off, even with placeholder */}
      {actualCameraOff && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full">
          <VideoOffIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
      )}
      <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs md:text-sm flex items-center">
        {participant.isMicMuted && <MicOffIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 text-red-400" />}
        <span className="truncate max-w-[100px] md:max-w-[150px]">{participant.name}</span>
        {participant.isHost && <span className="ml-1 text-blue-300 text-opacity-80 text-[10px] md:text-xs">(Host)</span>}
      </div>
    </div>
  );
};

export default VideoTile;
