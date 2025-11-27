// main.js
import * as WebRTCUtils from './webrtc-utils.js'; // Your original utility code
import { getLocalMediaStream } from './media.js';
import { sendMessage, receiveMessage } from './signaling.js';

// --- Global State ---
const PEER_A_ID = 'Alice';
const PEER_B_ID = 'Bob';

let pcA; // Alice's PeerConnection
let pcB; // Bob's PeerConnection
let localStreamA;

// --- Setup Function ---
async function startWebRTCCall() {
  console.log("--- Starting WebRTC Call Simulation ---");

  // 1. Get Local Media Stream (Alice's side)
  localStreamA = await getLocalMediaStream();
  if (!localStreamA) return;

  document.getElementById('localVideoA').srcObject = localStreamA;

  // 2. Initialize Peer Connections
  pcA = WebRTCUtils.createPeerConnection(WebRTCUtils.defaultConfiguration);
  pcB = WebRTCUtils.createPeerConnection(WebRTCUtils.defaultConfiguration);
  
  // Set up remote stream handlers (pcB watches pcA's stream)
  pcB.ontrack = (event) => {
    document.getElementById('remoteVideoB').srcObject = event.streams[0];
    console.log('[Bob] Received remote stream.');
  };

  // 3. Add Local Stream to Peer A
  WebRTCUtils.addLocalStream(pcA, localStreamA);

  // 4. Set up ICE Candidate Handlers
  // In a real app, these would call sendMessage() immediately.
  pcA.onicecandidate = (event) => {
    if (event.candidate) {
      sendMessage(PEER_A_ID, PEER_B_ID, { type: 'candidate', candidate: event.candidate });
    }
  };

  pcB.onicecandidate = (event) => {
    if (event.candidate) {
      sendMessage(PEER_B_ID, PEER_A_ID, { type: 'candidate', candidate: event.candidate });
    }
  };

  // 5. Create Offer (Alice initiates)
  const offer = await WebRTCUtils.createOffer(pcA);
  sendMessage(PEER_A_ID, PEER_B_ID, offer);
  console.log('[Alice] Sent Offer.');

  // 6. Bob Receives Offer and Creates Answer
  const receivedOffer = receiveMessage(PEER_B_ID); 
  if (receivedOffer) {
    const answer = await WebRTCUtils.createAnswer(pcB, receivedOffer);
    sendMessage(PEER_B_ID, PEER_A_ID, answer);
    console.log('[Bob] Sent Answer.');
  }

  // 7. Alice Receives Answer and Sets Remote Description
  const receivedAnswer = receiveMessage(PEER_A_ID);
  if (receivedAnswer) {
    await WebRTCUtils.handleAnswer(pcA, receivedAnswer);
    console.log('[Alice] Received and Handled Answer. Connection established.');
  }
  
  // 8. Process ICE Candidates (Simulated Exchange)
  // In a real app, this happens asynchronously as candidates arrive.
  setTimeout(() => {
    let candidate;
    while (candidate = receiveMessage(PEER_B_ID)) { // Bob receives Alice's candidates
      WebRTCUtils.handleIceCandidate(pcB, candidate.candidate);
      console.log('[Bob] Handled ICE Candidate from Alice.');
    }
    while (candidate = receiveMessage(PEER_A_ID)) { // Alice receives Bob's candidates
      WebRTCUtils.handleIceCandidate(pcA, candidate.candidate);
      console.log('[Alice] Handled ICE Candidate from Bob.');
    }
  }, 1000); // Give time for the process to run
}

// Attach to a button click in your HTML
document.getElementById('startButton').onclick = startWebRTCCall;