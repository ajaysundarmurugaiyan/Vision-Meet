// utils/signaling.js
import { db } from '../client/firebase';

// Store the unsubscribe function to clean up later
let unsubscribeCallbacks = {};

export const setupSignaling = (meetingId, localUserId, onMessage) => {
  // Clean up previous listeners if any
  if (unsubscribeCallbacks[meetingId]) {
    unsubscribeCallbacks[meetingId]();
  }

  // Set up Firestore listener for signaling messages
  const messagesRef = db.collection('meetings').doc(meetingId).collection('signaling');
  
  // Listen for messages where the recipient is the local user
  const unsubscribe = messagesRef
    .where('to', '==', localUserId)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const message = { id: change.doc.id, ...change.doc.data() };
          onMessage(message);
          // Optionally remove the message after processing
          change.doc.ref.delete().catch(console.error);
        }
      });
    });

  // Store the unsubscribe function
  unsubscribeCallbacks[meetingId] = unsubscribe;

  // Return cleanup function
  return () => {
    if (unsubscribeCallbacks[meetingId]) {
      unsubscribeCallbacks[meetingId]();
      delete unsubscribeCallbacks[meetingId];
    }
  };
};

export const sendMessage = async (meetingId, from, to, message) => {
  try {
    await db.collection('meetings').doc(meetingId).collection('signaling').add({
      ...message,
      from,
      to,
      timestamp: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

// Clean up all listeners
export const cleanupSignaling = () => {
  Object.values(unsubscribeCallbacks).forEach(unsubscribe => unsubscribe());
  unsubscribeCallbacks = {};
};