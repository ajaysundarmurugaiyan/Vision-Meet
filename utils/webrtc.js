// Basic WebRTC utility functions for video sharing

export const createPeerConnection = (configuration) => {
  const pc = new RTCPeerConnection(configuration);
  
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      // Send candidate to other peer via signaling server
      console.log('ICE candidate:', event.candidate);
    }
  };
  
  pc.ontrack = (event) => {
    console.log('Received remote stream:', event.streams[0]);
  };
  
  return pc;
};

export const addLocalStream = (peerConnection, localStream) => {
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
};

export const ensureAudioTransmission = (peerConnection, localStream) => {
  if (!peerConnection || !localStream) return;
  const existingSenders = peerConnection.getSenders ? peerConnection.getSenders() : [];
  localStream.getAudioTracks().forEach(track => {
    const alreadySending = existingSenders.some(sender => sender.track && sender.track.id === track.id);
    if (!alreadySending) {
      peerConnection.addTrack(track, localStream);
    }
  });
};

export const createOffer = async (peerConnection) => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

export const createAnswer = async (peerConnection, offer) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

export const handleAnswer = async (peerConnection, answer) => {
  await peerConnection.setRemoteDescription(answer);
};

export const handleIceCandidate = async (peerConnection, candidate) => {
  await peerConnection.addIceCandidate(candidate);
};

// Default STUN servers
export const defaultConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
