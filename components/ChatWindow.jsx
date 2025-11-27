import React, { useState, useContext, useEffect, useRef } from 'react';
import { MeetingContext } from '../contexts/MeetingContext';
import { v4 as uuidv4 } from 'uuid';

const ChatWindow = ({ onClose }) => {
  const { state, sendChatMessage } = useContext(MeetingContext);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [state.chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !state.userId || !state.userName) return;

    sendChatMessage(messageText.trim());
    setMessageText('');
  };

  return (
    <div
      className="fixed right-4 md:right-6 bottom-[120px] md:bottom-[148px] w-80 md:w-96 h-[60vh] md:h-[calc(100vh_-_200px)] max-h-[500px] md:max-h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col z-[70]"
      aria-live="polite"
      role="log"
    >
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-blue-300">Meeting Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
          aria-label="Close chat window"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-grow p-3 overflow-y-auto space-y-3">
        {state.chatMessages.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No messages yet. Start the conversation!</p>
        )}
        {state.chatMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === state.userId ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] p-2 rounded-lg shadow ${msg.senderId === state.userId ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <div className="text-xs font-semibold mb-0.5 opacity-80">
                {msg.senderId === state.userId ? 'You' : msg.senderName}
              </div>
              <p className="text-sm break-words">{msg.text}</p>
              <div className="text-xs opacity-60 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-100"
            aria-label="Chat message input"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
            disabled={!messageText.trim()}
            aria-label="Send chat message"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
