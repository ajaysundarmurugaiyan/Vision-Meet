import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { MeetingContext } from '../contexts/MeetingContext';
import { storage } from '../client/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import MeetingControls from '../components/MeetingControls';
import HostApprovalModal from '../components/HostApprovalModal';
import HostApproval from '../components/HostApproval';
import UsersIcon from '../components/icons/UsersIcon';
import ChatIcon from '../components/icons/ChatIcon';
import ChatWindow from '../components/ChatWindow';

const MeetingPage = () => {
  const { state, dispatch, setupLocalMediaStream, admitParticipant, denyParticipant, shareMediaFile, shareVideoStream, stopMediaShare, updateMediaState } = useContext(MeetingContext);
  const {
    meetingId,
    userId,
    userName,
    participants,
    mediaPermissionError,
    isMicMuted,
    isCameraOff,
    isHost,
    waitingParticipants,
    unreadChatMessages,
    sharedMedia,
    currentSharerId,
    localStream,
  } = state;

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [isUploadingMovie, setIsUploadingMovie] = useState(false);
  const [movieError, setMovieError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);
  const localPreviewRef = useRef(null);
  const videoRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const hostParticipant = useMemo(() => participants.find((p) => p.isHost), [participants]);
  const hostName = hostParticipant?.name || 'Host';
  const isCurrentUserHost = hostParticipant?.id === userId;

  const meetingLink = useMemo(() => {
    if (!meetingId || typeof window === 'undefined') return '';
    const origin = window.location.origin.replace(/\/$/, '');
    return `${origin}/#/join/${meetingId}`;
  }, [meetingId]);

  useEffect(() => {
    setupLocalMediaStream();
  }, [setupLocalMediaStream]);

  useEffect(() => {
    if (localPreviewRef.current && localStream) {
      if (localPreviewRef.current.srcObject !== localStream) {
        localPreviewRef.current.srcObject = localStream;
      }
    }
  }, [localStream]);

  // Sync video state
  useEffect(() => {
    if (!sharedMedia?.playbackState || !videoRef.current) return;

    const { isPlaying, currentTime, updatedAt } = sharedMedia.playbackState;
    const video = videoRef.current;

    // Ignore old updates (optional, but good for safety)
    if (Date.now() - updatedAt > 5000) return;

    const timeDiff = Math.abs(video.currentTime - currentTime);

    isRemoteUpdate.current = true;

    if (timeDiff > 2) {
      video.currentTime = currentTime;
    }

    if (isPlaying && video.paused) {
      video.play()
        .then(() => setAutoplayBlocked(false))
        .catch(e => {
          console.log('Autoplay blocked:', e);
          setAutoplayBlocked(true);
        });
    } else if (!isPlaying && !video.paused) {
      video.pause();
      setAutoplayBlocked(false);
    }

    // Reset flag after a short delay to allow events to fire without triggering loop
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 500);

  }, [sharedMedia?.playbackState]);

  // Effect to handle video source and stream capture
  useEffect(() => {
    if (!sharedMedia || !videoRef.current) return;

    const videoEl = videoRef.current;

    if (sharedMedia.sharerId === userId) {
      // Local sharer
      if (videoEl.src !== sharedMedia.url) {
        videoEl.src = sharedMedia.url;
      }

      if (!sharedMedia.stream) {
        const capture = () => {
          try {
            // Check for support
            if (!videoEl.captureStream && !videoEl.mozCaptureStream) {
              console.error("captureStream not supported on this browser");
              setMovieError("Screen sharing is not supported on this browser/device. Please try a desktop browser.");
              return;
            }

            const stream = videoEl.captureStream ? videoEl.captureStream(30) : (videoEl.mozCaptureStream ? videoEl.mozCaptureStream(30) : null);
            if (stream) {
              shareVideoStream(stream);
            } else {
              console.error("captureStream returned null");
              setMovieError("Failed to capture video stream.");
            }
          } catch (e) {
            console.error("Error capturing stream", e);
            setMovieError("Error starting video share: " + e.message);
          }
        };

        if (videoEl.readyState >= 1) {
          capture();
        } else {
          videoEl.onloadedmetadata = capture;
        }
      }
    } else {
      // Remote viewer
      const sharer = participants.find(p => p.id === sharedMedia.sharerId);
      if (sharer?.stream && videoEl.srcObject !== sharer.stream) {
        videoEl.srcObject = sharer.stream;
      }
    }
  }, [sharedMedia, userId, participants, shareVideoStream]);

  const handleVideoPlay = () => {
    if (isRemoteUpdate.current) return;
    if (sharedMedia?.sharerId !== userId) return; // Only sharer controls playback? Or everyone? Let's allow everyone or just sharer. Usually just sharer.
    // Actually, if we want "movie sharing", usually the host/sharer controls it.
    updateMediaState({ isPlaying: true, currentTime: videoRef.current?.currentTime });
  };

  const handleVideoPause = () => {
    if (isRemoteUpdate.current) return;
    if (sharedMedia?.sharerId !== userId) return;
    updateMediaState({ isPlaying: false, currentTime: videoRef.current?.currentTime });
  };

  const handleVideoSeek = () => {
    if (isRemoteUpdate.current) return;
    if (sharedMedia?.sharerId !== userId) return;
    updateMediaState({ isPlaying: !videoRef.current?.paused, currentTime: videoRef.current?.currentTime });
  };

  const handleToggleMic = () => {
    dispatch({
      type: 'UPDATE_LOCAL_USER_MEDIA_STATE',
      payload: { isMicMuted: !isMicMuted, isCameraOff }
    });
  };

  const handleToggleCamera = () => {
    dispatch({
      type: 'UPDATE_LOCAL_USER_MEDIA_STATE',
      payload: { isMicMuted, isCameraOff: !isCameraOff }
    });
  };

  const handleLeaveCall = () => {
    if (sharedMedia && currentSharerId === userId) {
      stopMediaShare();
    }
    dispatch({ type: 'LEAVE_MEETING' });
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) { /* Safari */
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) { /* IE11 */
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const handleCopyLink = () => {
    if (!meetingLink) return;
    const copyWithFallback = async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(meetingLink);
          return true;
        }
      } catch (error) {
        console.warn('navigator.clipboard unavailable, falling back', error);
      }
      try {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = meetingLink;
        tempTextArea.style.position = 'fixed';
        tempTextArea.style.left = '-9999px';
        document.body.appendChild(tempTextArea);
        tempTextArea.focus();
        tempTextArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        return successful;
      } catch (fallbackError) {
        console.error('Failed to copy meeting link', fallbackError);
        return false;
      }
    };

    copyWithFallback().then((copied) => {
      if (copied) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        alert('Unable to copy the join link automatically. Please copy it manually from the banner.');
      }
    });
  };

  const handleMovieShareClick = () => {
    if (currentSharerId && currentSharerId !== userId) return;
    setMovieError(null);
    if (!meetingId) {
      setMovieError('You need to be in a meeting to share a movie.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event) => {
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMovieError('Please select a video file.');
      inputEl.value = null;
      return;
    }

    if (!meetingId) {
      setMovieError('You need to be in a meeting to share a movie.');
      inputEl.value = null;
      return;
    }

    // Check for capture support before starting share
    const videoEl = document.createElement('video');
    if (!videoEl.captureStream && !videoEl.mozCaptureStream) {
      setMovieError("Screen sharing is not supported on this browser/device. Please try a desktop browser.");
      inputEl.value = null;
      return;
    }

    setMovieError(null);

    try {
      // Create a local URL for the file
      const fileUrl = URL.createObjectURL(file);

      const newSharedMedia = {
        id: Date.now().toString(),
        url: fileUrl,
        type: 'video',
        name: file.name,
        size: file.size,
        mimeType: file.type,
        sharerId: userId,
        sharerName: userName || 'Unknown',
        sharedAt: Date.now(),
        isLocal: true
      };

      shareMediaFile(newSharedMedia);
      inputEl.value = null;

    } catch (error) {
      console.error('Error preparing video for sharing', error);
      setMovieError('Unable to prepare the video for sharing.');
      inputEl.value = null;
    }
  };

  const toggleChatWindow = () => {
    setShowChatWindow(!showChatWindow);
    if (unreadChatMessages) {
      dispatch({ type: 'CLEAR_UNREAD_CHAT_MESSAGES' });
    }
  };

  const totalParticipants = participants.length;
  let gridCols = 'grid-cols-1';
  if (totalParticipants > 1) gridCols = 'grid-cols-2';
  if (totalParticipants > 4) gridCols = 'grid-cols-3';

  const handleApproveParticipant = (participant) => {
    admitParticipant(meetingId, participant);
  };

  const handleDenyParticipant = (participantId) => {
    denyParticipant(meetingId, participantId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {mediaPermissionError && (
        <div className="p-3 bg-red-600 text-center">{mediaPermissionError}</div>
      )}

      {meetingId && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-b border-gray-800 px-3 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-gray-300">
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-wide text-[11px] text-gray-400">Host</span>
                <span className="font-semibold text-white">{hostName}</span>
                {isCurrentUserHost && (
                  <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">
                    You
                  </span>
                )}
              </div>
              {meetingId && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-gray-500 hidden sm:inline">•</span>
                  <span className="uppercase tracking-wide text-[11px] text-gray-400 sm:text-[12px]">Meeting ID</span>
                  <code className="bg-gray-800 rounded px-2 py-0.5 text-white text-xs">{meetingId}</code>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm transition-colors"
              >
                {copiedLink ? 'Link Copied' : 'Copy Join Link'}
              </button>
              {isCurrentUserHost && (
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs sm:text-sm"
                >
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Manage Lobby
                  {waitingParticipants.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold">
                      {waitingParticipants.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
          {meetingLink && (
            <p className="mt-2 text-[11px] sm:text-xs text-gray-400 break-all">
              Share link:{' '}
              <a
                href={meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 underline break-all"
              >
                {meetingLink}
              </a>
            </p>
          )}
        </div>
      )}

      <main className="flex-grow px-3 sm:px-5 pt-28 sm:pt-32 pb-40 sm:pb-36 flex flex-col gap-4">
        <section className="w-full flex-1 rounded-2xl overflow-hidden bg-black border border-gray-700 flex items-center justify-center p-2 sm:p-4 min-h-[320px]">
          {sharedMedia ? (
            <div className="w-full h-full flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-300 gap-1">
                <span>
                  Now Playing:{' '}
                  <span className="font-semibold text-white break-all">{sharedMedia.name}</span>
                </span>
                <span className="text-gray-400">
                  Shared by: {sharedMedia.sharerId === userId ? 'You' : sharedMedia.sharerName || 'Guest'}
                </span>
              </div>
              <div className="relative w-full h-full flex-1 min-h-0 bg-black rounded-xl overflow-hidden group">
                <video
                  ref={videoRef}
                  key={sharedMedia.id} // Key ensures re-render if media changes
                  controls={true}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onSeeked={handleVideoSeek}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>

                {autoplayBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.play().catch(console.error);
                          setAutoplayBlocked(false);
                        }
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-500 transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Tap to Play Movie
                    </button>
                  </div>
                )}

                {/* Fullscreen Button Overlay */}
                <button
                  onClick={toggleFullScreen}
                  className="absolute bottom-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all transform active:scale-95 z-10"
                  title="Full Screen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-300 space-y-6 w-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-500">
                    {(userName || 'Guest').substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="px-4">
                  <p className="text-xl sm:text-2xl font-semibold text-white">No movie is being shared yet</p>
                  <p className="text-gray-400 text-sm sm:text-base">Tap “Share Movie” to pick a video and stream it to everyone.</p>
                </div>
              </div>
              {localStream && (
                <div className="max-w-xl w-full mx-auto px-2">
                  <video
                    ref={localPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-xl border border-gray-700 opacity-60"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {(movieError || isUploadingMovie) && (
          <div className="text-center text-sm space-y-2">
            {movieError && (
              <div className="text-red-400 bg-red-900/30 border border-red-700 rounded-lg py-2 px-4">
                {movieError}
              </div>
            )}
            {isUploadingMovie && (
              <div className="text-blue-200 bg-blue-900/30 border border-blue-700 rounded-lg py-2 px-4">
                Uploading movie... {uploadProgress ?? 0}%
              </div>
            )}
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      <MeetingControls
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onLeaveCall={handleLeaveCall}
        onShareMovie={handleMovieShareClick}
        onStopMovieShare={() => stopMediaShare()}
        isCurrentUserSharing={sharedMedia?.sharerId === userId}
        movieShareDisabled={!!sharedMedia && sharedMedia.sharerId !== userId}
        isUploadingMovie={isUploadingMovie}
      />

      <button
        onClick={toggleChatWindow}
        className="fixed bottom-24 sm:bottom-24 right-4 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
      >
        <ChatIcon className="w-6 h-6" />
        {unreadChatMessages && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs">!</span>
        )}
      </button>

      {
        isHost && (
          <HostApprovalModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            waitingParticipants={waitingParticipants}
            onApprove={handleApproveParticipant}
            onDeny={handleDenyParticipant}
          />
        )
      }

      {
        isHost && (
          <HostApproval
            waitingParticipants={waitingParticipants}
            onApprove={handleApproveParticipant}
            onDeny={handleDenyParticipant}
          />
        )
      }

      {
        showChatWindow && (
          <ChatWindow onClose={() => setShowChatWindow(false)} />
        )
      }
    </div >
  );
};

export default MeetingPage;
