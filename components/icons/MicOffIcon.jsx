import React from 'react';

const MicOffIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.17 5.17c.09-.1.17-.21.23-.35H15v-2h-2v.38l-2-2V5c0-.55-.45-1-1-1s-1 .45-1 1v.38l-2-2V5c0-1.66 1.34-3 3-3s3 1.34 3 3v6c0 .7-.13 1.37-.35 2H15c.7 0 1.37-.13 2-.35v.18l5.17 5.17L22.34 21 1.66 0l1.06 1.06L5.91 4.17C5.34 4.68 5 5.3 5 6v6c0 3.31 2.69 6 6 6 .7 0 1.37-.13 2-.35l1.74 1.74c-.65.24-1.33.37-2.04.4V21h4v-1.82c.71-.03 1.39-.16 2.04-.4l1.74 1.74L21.28 22l1.06-1.06L12 11.17V14zM19 12h-2v-2h2v2z"></path>
    <path d="M2.93 2.93L1.87 4l4.21 4.21C5.38 8.78 5 9.82 5 11v1c0 2.76 2.24 5 5 5 .38 0 .75-.04 1.1-.12l3.02 3.02c-.98.44-2.07.7-3.22.7-3.31 0-6-2.69-6-6H3c0 3.53 2.84 6.43 6.35 6.92V22h1.3v-2.08c.69-.1 1.36-.29 2-.55L20 21.07l1.06-1.06-18.13-18.13zM17 11c0 .22-.03.43-.07.64L12.6 7.29c.16-.04.33-.07.5-.07 1.66 0 3 1.34 3 3z"></path>
    <path d="M0 0h24v24H0V0z" fill="none"></path>
  </svg>
);

// A more standard mic-off icon
const StandardMicOffIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor">
    <g><rect fill="none" height="24" width="24"/></g>
    <g><g>
      <path d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/>
      <path d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/>
      <line x1="4.27" x2="20.73" y1="3.27" y2="19.73" stroke="currentColor" strokeWidth="2"/>
    </g></g>
  </svg>
);

export default MicOffIcon;
