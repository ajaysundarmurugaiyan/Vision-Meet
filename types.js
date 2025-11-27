// This file contains type definitions that have been converted to JSDoc comments
// for documentation purposes in JavaScript. The actual type checking has been removed.

/**
 * @typedef {Object} Participant
 * @property {string} id - The participant's unique identifier
 * @property {string} name - The participant's display name
 * @property {MediaStream|null} [stream] - The participant's media stream
 * @property {boolean} [isLocal] - Whether this is the local user
 * @property {boolean} [isMicMuted] - Whether the participant's microphone is muted
 * @property {boolean} [isCameraOff] - Whether the participant's camera is off
 * @property {boolean} [isHost] - Whether the participant is the meeting host
 * @property {string} [meetingId] - The meeting ID the participant belongs to
 */

/**
 * @typedef {Object} WaitingParticipant
 * @property {string} id - The waiting participant's unique identifier
 * @property {string} name - The waiting participant's display name
 * @property {string} meetingId - The meeting ID they're trying to join
 * @property {number} timestamp - When they requested to join
 * @property {boolean} [isHost] - Whether they are the host
 */

/**
 * @typedef {Object} SharedFile
 * @property {string} id - The file's unique identifier
 * @property {string} url - The file's URL
 * @property {'image'|'video'|'other'} type - The type of file
 * @property {string} name - The file's display name
 * @property {string} sharerId - The ID of the user sharing the file
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - The message's unique identifier
 * @property {string} senderId - The ID of the message sender
 * @property {string} senderName - The name of the message sender
 * @property {string} text - The message content
 * @property {number} timestamp - When the message was sent
 */

/**
 * @typedef {Object} MeetingState
 * @property {string|null} meetingId - The current meeting ID
 * @property {string|null} userName - The current user's name
 * @property {string|null} userId - The current user's ID
 * @property {boolean} isHost - Whether the current user is the host
 * @property {MediaStream|null} localStream - The local user's media stream
 * @property {Participant[]} participants - All participants in the meeting
 * @property {WaitingParticipant[]} waitingParticipants - Participants waiting to join
 * @property {SharedFile|null} sharedFile - Currently shared file
 * @property {string|null} currentSharerId - ID of user currently sharing
 * @property {string|null} mediaPermissionError - Any media permission errors
 * @property {boolean} isMicMuted - Whether microphone is muted
 * @property {boolean} isCameraOff - Whether camera is off
 * @property {ChatMessage[]} chatMessages - All chat messages
 * @property {boolean} unreadChatMessages - Whether there are unread messages
 * @property {boolean|null} preShareMicMuted - Mic state before file share
 * @property {boolean|null} preShareCameraOff - Camera state before file share
 */

/**
 * @typedef {Object} User
 * @property {number} id - The user's ID
 * @property {string} name - The user's name
 */

// Meeting action types - these are string literals used in the reducer
export const MeetingActionTypes = {
  TOGGLE_MIC: 'TOGGLE_MIC',
  TOGGLE_CAMERA: 'TOGGLE_CAMERA',
  START_SHARING_FILE: 'START_SHARING_FILE',
  STOP_SHARING_FILE: 'STOP_SHARING_FILE',
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT'
};

// Export empty object to maintain module structure
export {};
