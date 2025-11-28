import React, { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { db, firebase } from '../client/firebase';
import { createPeerConnection, addLocalStream, createOffer, createAnswer, handleAnswer, handleIceCandidate, defaultConfiguration, ensureAudioTransmission } from '../utils/webrtc';

const initialState = {
  meetingId: null,
  userName: null,
  userId: null,
  isHost: false,
  localStream: null,
  participants: [],
  waitingParticipants: [],
  mediaPermissionError: null,
  isMicMuted: false,
  isCameraOff: false,
  chatMessages: [],
  unreadChatMessages: false,
  preShareMicMuted: null,
  preShareCameraOff: null,
  peerConnections: {},
  isScreenSharing: false,
  screenShareStream: null,
  sharedMedia: null,
  currentSharerId: null,
};

const meetingReducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_MEETING':
    case 'REQUEST_JOIN_MEETING': {
      const { userName, userId, meetingId } = action.payload;
      return {
        ...state,
        userName,
        userId,
        meetingId,
        isHost: action.type === 'CREATE_MEETING'
      };
    }
    case 'SET_LOCAL_STREAM': {
      const { stream, micMuted, cameraOff } = action.payload;
      return {
        ...state,
        localStream: stream,
        isMicMuted: micMuted,
        isCameraOff: cameraOff,
        participants: state.participants.map(p =>
          p.id === state.userId
            ? { ...p, stream, isMicMuted: micMuted, isCameraOff: cameraOff }
            : p
        ),
        mediaPermissionError: null,
      };
    }
    case 'SET_MEDIA_ERROR': {
      return { ...state, mediaPermissionError: action.payload };
    }
    case 'UPDATE_LOCAL_USER_MEDIA_STATE': {
      const { isMicMuted, isCameraOff } = action.payload;
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach(track => track.enabled = !isMicMuted);
        state.localStream.getVideoTracks().forEach(track => track.enabled = !isCameraOff);
      }
      return {
        ...state,
        isMicMuted,
        isCameraOff,
        participants: state.participants.map(p =>
          p.id === state.userId
            ? { ...p, isMicMuted, isCameraOff }
            : p
        ),
      };
    }
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'UPDATE_PARTICIPANT_STREAM': {
      const { participantId, stream } = action.payload;
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === participantId ? { ...p, stream } : p
        )
      };
    }
    case 'SET_WAITING_PARTICIPANTS':
      return { ...state, waitingParticipants: action.payload };
    case 'ADD_WAITING_PARTICIPANT': {
      if (state.waitingParticipants.some(p => p.id === action.payload.id)) {
        return state;
      }
      return { ...state, waitingParticipants: [...state.waitingParticipants, action.payload] };
    }
    case 'REMOVE_WAITING_PARTICIPANT': {
      return { ...state, waitingParticipants: state.waitingParticipants.filter(p => p.id !== action.payload) };
    }
    case 'SET_SCREEN_SHARE_STATE': {
      const { isScreenSharing, stream } = action.payload;
      return {
        ...state,
        isScreenSharing,
        screenShareStream: stream || null,
      };
    }
    case 'SET_SHARED_MEDIA': {
      return { ...state, sharedMedia: action.payload || null };
    }
    case 'SET_CURRENT_SHARER_ID': {
      return { ...state, currentSharerId: action.payload || null };
    }
    case 'SET_CHAT_MESSAGES': {
      return { ...state, chatMessages: action.payload, unreadChatMessages: state.chatMessages.length < action.payload.length };
    }
    case 'ADD_CHAT_MESSAGE':
    case 'SEND_CHAT_MESSAGE': {
      // Local optimistic update, though Firestore listener will override
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
        unreadChatMessages: true
      };
    }
    case 'CLEAR_UNREAD_CHAT_MESSAGES': {
      return { ...state, unreadChatMessages: false };
    }
    case 'ADD_PEER_CONNECTION': {
      const { participantId, peerConnection } = action.payload;
      return {
        ...state,
        peerConnections: {
          ...state.peerConnections,
          [participantId]: peerConnection
        }
      };
    }
    case 'REMOVE_PEER_CONNECTION': {
      const { [action.payload]: removed, ...rest } = state.peerConnections;
      return { ...state, peerConnections: rest };
    }
    case 'LEAVE_MEETING': {
      state.localStream?.getTracks().forEach(track => track.stop());
      state.screenShareStream?.getTracks().forEach(track => track.stop());
      Object.values(state.peerConnections || {}).forEach(peerConnection => {
        try {
          peerConnection?.close();
        } catch (error) {
          console.error('Error closing peer connection on leave', error);
        }
      });
      return {
        ...initialState,
        mediaPermissionError: "You have left the meeting."
      };
    }
    default:
      return state;
  }
};

const MeetingContext = createContext({
  state: initialState,
  dispatch: () => null,
  setupLocalMediaStream: async () => null,
  stopLocalMediaStream: () => { },
  createMeeting: async () => null,
  joinMeeting: async () => false,
  admitParticipant: async () => { },
  denyParticipant: async () => { },
  startScreenShare: async () => false,
  stopScreenShare: () => { },
  shareMediaFile: async () => false,
  shareVideoStream: async () => { },
  stopMediaShare: () => { },
  sendChatMessage: async () => { },
});

const MeetingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(meetingReducer, initialState);
  const peerConnectionMetaRef = useRef({});
  const connectionListenersRef = useRef({});
  const screenShareAudioSendersRef = useRef({});

  const setupLocalMediaStream = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Media devices not supported. Please ensure you are using HTTPS or localhost.';
      console.error(errorMsg);
      dispatch({ type: 'SET_LOCAL_STREAM', payload: { stream: null, micMuted: true, cameraOff: true } });
      // We might want to store this error in state to show to user
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      dispatch({ type: 'SET_LOCAL_STREAM', payload: { stream, micMuted: false, cameraOff: false } });
      return stream;
    } catch (error) {
      console.error('Error accessing media devices.', error);
      let errorMessage = 'Failed to access camera/microphone.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow camera and microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found.';
      }
      dispatch({ type: 'SET_MEDIA_ERROR', payload: errorMessage });
      return null;
    }
  }, []);

  const stopLocalMediaStream = useCallback(() => {
    state.localStream?.getTracks().forEach(track => track.stop());
    dispatch({ type: 'SET_LOCAL_STREAM', payload: { stream: null, micMuted: true, cameraOff: true } });
  }, [state.localStream]);

  const addLocalTracksToConnection = useCallback((peerConnection, customStream) => {
    const streamToUse = customStream || state.localStream;
    if (!streamToUse) return;
    addLocalStream(peerConnection, streamToUse);
    ensureAudioTransmission(peerConnection, streamToUse);
  }, [state.localStream]);

  const replaceVideoTrackOnConnections = useCallback((newTrack) => {
    if (!newTrack) return;
    Object.values(state.peerConnections).forEach((peerConnection) => {
      if (!peerConnection) return;
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          sender.replaceTrack(newTrack);
        }
      });
    });
  }, [state.peerConnections]);

  const stopScreenShare = useCallback(() => {
    if (state.screenShareStream) {
      state.screenShareStream.getTracks().forEach((track) => track.stop());
    }

    Object.entries(screenShareAudioSendersRef.current).forEach(([participantId, sender]) => {
      const peerConnection = state.peerConnections[participantId];
      if (peerConnection && sender) {
        try {
          peerConnection.removeTrack(sender);
        } catch (error) {
          console.error('Error removing screen share audio track', error);
        }
      }
    });
    screenShareAudioSendersRef.current = {};

    const cameraTrack = state.localStream?.getVideoTracks()?.[0];
    if (cameraTrack) {
      replaceVideoTrackOnConnections(cameraTrack);
    }

    dispatch({
      type: 'SET_SCREEN_SHARE_STATE',
      payload: { isScreenSharing: false, stream: null }
    });
  }, [state.screenShareStream, state.localStream, state.peerConnections, replaceVideoTrackOnConnections]);

  const startScreenShare = useCallback(async () => {
    if (state.isScreenSharing) {
      return false;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        console.warn('No video track available from screen share');
        return false;
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      replaceVideoTrackOnConnections(screenTrack);

      const audioTrack = screenStream.getAudioTracks()[0];
      if (audioTrack) {
        Object.entries(state.peerConnections).forEach(([participantId, peerConnection]) => {
          try {
            const sender = peerConnection.addTrack(audioTrack, screenStream);
            screenShareAudioSendersRef.current[participantId] = sender;
          } catch (error) {
            console.error('Error adding screen share audio track', error);
          }
        });
      }

      dispatch({
        type: 'SET_SCREEN_SHARE_STATE',
        payload: { isScreenSharing: true, stream: screenStream }
      });
      return true;
    } catch (error) {
      console.error('Error starting screen share', error);
      return false;
    }
  }, [state.isScreenSharing, state.peerConnections, replaceVideoTrackOnConnections, stopScreenShare]);

  const shareMediaFile = useCallback(async (filePayload) => {
    if (!state.meetingId) return false;

    try {
      // Update local state
      dispatch({
        type: 'SET_SHARED_MEDIA',
        payload: {
          ...filePayload,
          stream: null // Stream will be set via shareVideoStream
        }
      });
      dispatch({
        type: 'SET_CURRENT_SHARER_ID',
        payload: filePayload.sharerId || state.userId
      });

      // Notify others via Firestore
      const meetingRef = db.doc('meetings/' + state.meetingId);
      await meetingRef.set({
        sharedMedia: {
          sharerId: state.userId,
          sharerName: state.userName,
          type: 'video',
          name: filePayload.name,
          isRemoteStream: true
        }
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error sharing media file:', error);
      return false;
    }
  }, [state.meetingId, state.userId, state.userName]);

  const shareVideoStream = useCallback(async (stream) => {
    if (!stream) return;

    // Update state with the stream
    dispatch({
      type: 'SET_SHARED_MEDIA',
      payload: {
        ...state.sharedMedia,
        stream
      }
    });

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    Object.entries(state.peerConnections).forEach(([peerId, peerConnection]) => {
      try {
        // Replace video track
        if (videoTrack) {
          const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(videoTrack).then(() => {
              // Enhance quality after replacing track
              const params = videoSender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = 50000000; // 50 Mbps
              params.encodings[0].scaleResolutionDownBy = 1.0;
              params.encodings[0].networkPriority = 'high';
              params.encodings[0].priority = 'high';
              videoSender.setParameters(params).catch(e => console.warn("Could not set video parameters", e));
            });
          } else {
            const sender = peerConnection.addTrack(videoTrack, stream);
            // Enhance quality
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            params.encodings[0].maxBitrate = 50000000; // 50 Mbps
            params.encodings[0].scaleResolutionDownBy = 1.0;
            params.encodings[0].networkPriority = 'high';
            params.encodings[0].priority = 'high';
            sender.setParameters(params).catch(e => console.warn("Could not set video parameters", e));
          }
        }

        // Replace audio track
        if (audioTrack) {
          const audioSender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(audioTrack);
          } else {
            peerConnection.addTrack(audioTrack, stream);
          }
        }
      } catch (error) {
        console.error('Error sharing tracks with peer:', peerId, error);
      }
    });
  }, [state.sharedMedia, state.peerConnections]);

  const updateMediaState = useCallback(async (mediaState) => {
    if (!state.meetingId || !state.sharedMedia || state.sharedMedia.isLocal) return;

    try {
      const meetingRef = db.doc('meetings/' + state.meetingId);
      await meetingRef.set({
        sharedMedia: {
          ...state.sharedMedia,
          playbackState: {
            ...mediaState,
            updatedAt: Date.now()
          }
        }
      }, { merge: true });
    } catch (error) {
      console.error('Error updating media state:', error);
    }
  }, [state.meetingId, state.sharedMedia]);

  // Find the stopMediaShare function and replace it with:
  const stopMediaShare = useCallback(async () => {
    if (!state.meetingId) return;

    try {
      // Stop all tracks in the shared media stream
      if (state.sharedMedia?.stream) {
        state.sharedMedia.stream.getTracks().forEach(track => track.stop());
      }

      // Clean up local URL if it's a local file
      if (state.sharedMedia?.isLocal && state.sharedMedia.url) {
        URL.revokeObjectURL(state.sharedMedia.url);
        // Remove the hidden video element if we can find it? 
        // We didn't store a reference to it. 
        // But we can just rely on garbage collection if we removed it from DOM?
        // Wait, we appended it to body. We need to remove it.
        // We should have stored it in a ref or something.
        // For now, let's try to find it by src? No, src is revoked.
        // Let's just remove all video elements that are hidden and have blob src? Risky.
        // Better: store the video element in state or ref.
        // But we are in a callback.
        // Let's just query selector for videos with style top -9999px.
        const hiddenVideos = document.querySelectorAll('video[style*="-9999px"]');
        hiddenVideos.forEach(v => v.remove());
      }

      // Update Firestore to remove sharedMedia
      const meetingRef = db.doc('meetings/' + state.meetingId);
      await meetingRef.set({ sharedMedia: null }, { merge: true });

      // Reset the shared media state
      dispatch({ type: 'SET_SHARED_MEDIA', payload: null });
      dispatch({ type: 'SET_CURRENT_SHARER_ID', payload: null });

      // Revert tracks in peer connections to local camera/mic
      // We need to get the original local stream tracks
      const cameraTrack = state.localStream?.getVideoTracks()[0];
      const micTrack = state.localStream?.getAudioTracks()[0];

      Object.values(state.peerConnections).forEach(peerConnection => {
        const senders = peerConnection.getSenders();

        // Revert Video
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          if (cameraTrack && !state.isCameraOff) {
            videoSender.replaceTrack(cameraTrack);
          } else {
            // If camera was off or no track, maybe replace with null or keep black?
            // If we replace with null, it might stop sending.
            // Better to replace with camera track if available, even if "muted" (enabled=false)
            videoSender.replaceTrack(cameraTrack || null);
          }
        }

        // Revert Audio
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        if (audioSender) {
          audioSender.replaceTrack(micTrack || null);
        }
      });

    } catch (error) {
      console.error('Error stopping media share:', error);
    }
  }, [state.meetingId, state.sharedMedia, state.peerConnections, state.localStream, state.isCameraOff]);

  const createMeeting = useCallback(async (userName, userId) => {
    const meetingId = Math.random().toString(36).substring(2, 10);
    try {
      const meetingRef = db.doc('meetings/' + meetingId);
      await meetingRef.set({ createdAt: firebase.firestore.FieldValue.serverTimestamp(), hostId: userId });

      const participantRef = db.doc('meetings/' + meetingId + '/participants/' + userId);
      await participantRef.set({ name: userName, id: userId, isHost: true });

      dispatch({ type: 'CREATE_MEETING', payload: { userName, userId, meetingId, stream: null } });
      return meetingId;
    } catch (error) {
      console.error("Error creating meeting: ", error);
      return null;
    }
  }, []);

  const joinMeeting = useCallback(async (userName, userId, meetingId) => {
    try {
      const meetingRef = db.doc('meetings/' + meetingId);
      const meetingSnap = await meetingRef.get();
      if (!meetingSnap.exists) {
        console.error("No such meeting!");
        return false;
      }

      const waitingRoomRef = db.collection('meetings/' + meetingId + '/waitingRoom');
      await waitingRoomRef.doc(userId).set({ name: userName, id: userId, timestamp: firebase.firestore.FieldValue.serverTimestamp() });

      dispatch({ type: 'REQUEST_JOIN_MEETING', payload: { userName, userId, meetingId } });
      dispatch({ type: 'ADD_WAITING_PARTICIPANT', payload: { name: userName, id: userId } });
      return true;
    } catch (error) {
      console.error("Error joining meeting: ", error);
      return false;
    }
  }, []);

  const admitParticipant = useCallback(async (meetingId, participant) => {
    try {
      const participantRef = db.doc('meetings/' + meetingId + '/participants/' + participant.id);
      await participantRef.set({ name: participant.name, id: participant.id, isHost: false });

      const waitingDocRef = db.doc('meetings/' + meetingId + '/waitingRoom/' + participant.id);
      await waitingDocRef.delete();
      dispatch({ type: 'REMOVE_WAITING_PARTICIPANT', payload: participant.id });
    } catch (error) {
      console.error("Error admitting participant: ", error);
    }
  }, []);

  const denyParticipant = useCallback(async (meetingId, participantId) => {
    try {
      const waitingDocRef = db.doc('meetings/' + meetingId + '/waitingRoom/' + participantId);
      await waitingDocRef.delete();
      dispatch({ type: 'REMOVE_WAITING_PARTICIPANT', payload: participantId });
    } catch (error) {
      console.error("Error denying participant: ", error);
    }
  }, []);

  const sendChatMessage = useCallback(async (text) => {
    if (!state.meetingId || !state.userId) return;
    try {
      await db.collection('meetings/' + state.meetingId + '/chat').add({
        senderId: state.userId,
        senderName: state.userName,
        text,
        timestamp: Date.now() // Use client timestamp for simpler sorting or serverTimestamp
      });
    } catch (error) {
      console.error("Error sending chat:", error);
    }
  }, [state.meetingId, state.userId, state.userName]);

  // WebRTC functions
  const teardownPeerConnection = useCallback((participantId) => {
    const meta = peerConnectionMetaRef.current[participantId];
    if (meta?.peerConnection) {
      try {
        meta.peerConnection.ontrack = null;
        meta.peerConnection.onicecandidate = null;
        meta.peerConnection.onconnectionstatechange = null;
        meta.peerConnection.close();
      } catch (error) {
        console.error('Error closing peer connection', error);
      }
    }
    if (connectionListenersRef.current[participantId]) {
      connectionListenersRef.current[participantId]();
      delete connectionListenersRef.current[participantId];
    }
    delete peerConnectionMetaRef.current[participantId];
    if (screenShareAudioSendersRef.current[participantId]) {
      delete screenShareAudioSendersRef.current[participantId];
    }
    dispatch({ type: 'REMOVE_PEER_CONNECTION', payload: participantId });
    dispatch({
      type: 'UPDATE_PARTICIPANT_STREAM',
      payload: { participantId, stream: null }
    });
  }, []);

  const setupPeerConnectionWithParticipant = useCallback(async (participantId) => {
    if (!participantId || !state.meetingId || !state.userId) return;
    let ensuredStream = state.localStream;
    if (!ensuredStream) {
      ensuredStream = await setupLocalMediaStream();
    }
    if (!ensuredStream) return;
    if (peerConnectionMetaRef.current[participantId]) return;

    try {
      const peerConnection = createPeerConnection(defaultConfiguration);
      addLocalTracksToConnection(peerConnection, ensuredStream);

      if (state.isScreenSharing && state.screenShareStream) {
        const screenVideoTrack = state.screenShareStream.getVideoTracks()[0];
        if (screenVideoTrack) {
          peerConnection.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === 'video') {
              sender.replaceTrack(screenVideoTrack);
            }
          });
        }
        const screenAudioTrack = state.screenShareStream.getAudioTracks()[0];
        if (screenAudioTrack) {
          try {
            const sender = peerConnection.addTrack(screenAudioTrack, state.screenShareStream);
            screenShareAudioSendersRef.current[participantId] = sender;
          } catch (error) {
            console.error('Error adding screen share audio track for new participant', error);
          }
        }
      }

      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        dispatch({
          type: 'UPDATE_PARTICIPANT_STREAM',
          payload: { participantId, stream: remoteStream }
        });
      };

      peerConnection.onconnectionstatechange = () => {
        if (['closed', 'failed', 'disconnected'].includes(peerConnection.connectionState)) {
          teardownPeerConnection(participantId);
        }
      };

      const connectionId = [state.userId, participantId].sort().join('_');
      const connectionDocRef = db.collection(`meetings/${state.meetingId}/connections`).doc(connectionId);
      const candidatesCollection = connectionDocRef.collection('candidates');

      const meta = {
        peerConnection,
        connectionId,
        isInitiator: state.userId < participantId,
        offerHandled: false,
        answerHandled: false,
        remoteDescriptionSet: false,
        queuedRemoteCandidates: [],
        candidateIds: new Set(),
      };
      peerConnectionMetaRef.current[participantId] = meta;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          candidatesCollection.add({
            from: state.userId,
            candidate: event.candidate.toJSON(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          }).catch((error) => console.error('Error sending ICE candidate', error));
        }
      };

      dispatch({
        type: 'ADD_PEER_CONNECTION',
        payload: { participantId, peerConnection }
      });

      const existingConnectionDoc = await connectionDocRef.get();
      if (!existingConnectionDoc.exists) {
        await connectionDocRef.set({
          participants: [state.userId, participantId],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (meta.isInitiator) {
        const offer = await createOffer(peerConnection);
        await connectionDocRef.set({
          participants: [state.userId, participantId],
          offer: { type: offer.type, sdp: offer.sdp },
          offerBy: state.userId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      const unsubscribeDoc = connectionDocRef.onSnapshot(async (doc) => {
        const data = doc.data();
        if (!data) return;

        if (data.offer && data.offerBy !== state.userId && !meta.offerHandled) {
          meta.offerHandled = true;
          try {
            const rtcOffer = new RTCSessionDescription(data.offer);
            const answer = await createAnswer(peerConnection, rtcOffer);
            meta.remoteDescriptionSet = true;
            meta.queuedRemoteCandidates.forEach((candidate) => {
              handleIceCandidate(peerConnection, candidate).catch((error) =>
                console.error('Error adding queued ICE candidate', error)
              );
            });
            meta.queuedRemoteCandidates = [];
            await connectionDocRef.set({
              answer: { type: answer.type, sdp: answer.sdp },
              answerBy: state.userId,
              answeredAt: firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          } catch (error) {
            console.error('Error responding to offer', error);
          }
        }

        if (data.answer && data.answerBy !== state.userId && !meta.answerHandled) {
          meta.answerHandled = true;
          try {
            const rtcAnswer = new RTCSessionDescription(data.answer);
            await handleAnswer(peerConnection, rtcAnswer);
            meta.remoteDescriptionSet = true;
            meta.queuedRemoteCandidates.forEach((candidate) => {
              handleIceCandidate(peerConnection, candidate).catch((error) =>
                console.error('Error adding queued ICE candidate', error)
              );
            });
            meta.queuedRemoteCandidates = [];
          } catch (error) {
            console.error('Error applying answer', error);
          }
        }
      });

      const unsubscribeCandidates = candidatesCollection
        .where('from', '!=', state.userId)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const changeId = change.doc.id;
              if (meta.candidateIds.has(changeId)) return;
              meta.candidateIds.add(changeId);
              const candidateData = change.doc.data();
              if (!candidateData?.candidate) return;
              const rtcCandidate = new RTCIceCandidate(candidateData.candidate);
              if (!meta.remoteDescriptionSet) {
                meta.queuedRemoteCandidates.push(rtcCandidate);
                return;
              }
              handleIceCandidate(peerConnection, rtcCandidate)
                .catch((error) => console.error('Error adding ICE candidate', error));
            }
          });
        });

      connectionListenersRef.current[participantId] = () => {
        unsubscribeDoc();
        unsubscribeCandidates();
      };
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  }, [state.meetingId, state.userId, state.localStream, state.isScreenSharing, state.screenShareStream, addLocalTracksToConnection, teardownPeerConnection, setupLocalMediaStream]);

  useEffect(() => {
    if (!state.meetingId) return;

    const participantsRef = db.collection('meetings/' + state.meetingId + '/participants');
    const unsubscribeParticipants = participantsRef.onSnapshot((snapshot) => {
      const participants = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      dispatch({ type: 'SET_PARTICIPANTS', payload: participants });
    });

    const waitingRoomRef = db.collection('meetings/' + state.meetingId + '/waitingRoom');
    const unsubscribeWaitingRoom = waitingRoomRef.onSnapshot((snapshot) => {
      const waitingParticipants = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      dispatch({ type: 'SET_WAITING_PARTICIPANTS', payload: waitingParticipants });
    });

    const meetingRef = db.doc('meetings/' + state.meetingId);
    const unsubscribeMeeting = meetingRef.onSnapshot((snapshot) => {
      const data = snapshot.data();
      const remoteSharedMedia = data?.sharedMedia || null;

      dispatch({ type: 'SET_CURRENT_SHARER_ID', payload: remoteSharedMedia?.sharerId || null });

      // If I am not the sharer, update my local sharedMedia state to match remote
      if (!remoteSharedMedia || remoteSharedMedia.sharerId !== state.userId) {
        dispatch({ type: 'SET_SHARED_MEDIA', payload: remoteSharedMedia });
      }
    });

    const chatRef = db.collection('meetings/' + state.meetingId + '/chat').orderBy('timestamp', 'asc');
    const unsubscribeChat = chatRef.onSnapshot((snapshot) => {
      const messages = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      dispatch({ type: 'SET_CHAT_MESSAGES', payload: messages });
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeWaitingRoom();
      unsubscribeMeeting();
      unsubscribeChat();
    };
  }, [state.meetingId, state.isHost]);

  useEffect(() => {
    if (!state.meetingId || !state.userId) return;
    const joined = state.participants.some(p => p.id === state.userId);
    const wasWaiting = state.waitingParticipants.some(wp => wp.id === state.userId);
    if (joined && wasWaiting) {
      dispatch({
        type: 'SET_WAITING_PARTICIPANTS',
        payload: state.waitingParticipants.filter(wp => wp.id !== state.userId)
      });
    }
  }, [state.meetingId, state.userId, state.participants]);

  useEffect(() => {
    if (!state.meetingId || !state.userId || !state.localStream) return;

    state.participants
      .filter((participant) => participant.id !== state.userId)
      .forEach((participant) => {
        setupPeerConnectionWithParticipant(participant.id);
      });

    Object.keys(peerConnectionMetaRef.current).forEach((participantId) => {
      const stillPresent = state.participants.some((p) => p.id === participantId);
      if (!stillPresent) {
        teardownPeerConnection(participantId);
      }
    });
  }, [state.participants, state.meetingId, state.userId, state.localStream, setupPeerConnectionWithParticipant, teardownPeerConnection]);

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return (
    <MeetingContext.Provider value={{
      state,
      dispatch,
      setupLocalMediaStream,
      stopLocalMediaStream,
      createMeeting,
      joinMeeting,
      admitParticipant,
      denyParticipant,
      startScreenShare,
      stopScreenShare,
      shareMediaFile,
      shareVideoStream,
      stopMediaShare,
      sendChatMessage,
      updateMediaState,
    }}>
      {children}
    </MeetingContext.Provider>
  );
};

export { MeetingContext, MeetingProvider };
