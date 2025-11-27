import React from 'react';

const HostApproval = ({ waitingParticipants, onApprove, onDeny }) => {
  return (
    <div className="host-approval">
      <h2>Waiting Room</h2>
      {waitingParticipants.length === 0 ? (
        <p>No participants waiting</p>
      ) : (
        <ul>
          {waitingParticipants.map(participant => (
            <li key={participant.id} className="participant-item">
              <span>{participant.name}</span>
              <button onClick={() => onApprove(participant)}>Approve</button>
              <button onClick={() => onDeny(participant.id)}>Deny</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HostApproval;
