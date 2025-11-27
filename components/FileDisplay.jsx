import React from 'react';

const FileDisplay = ({ file }) => {
  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4">
      <p className="text-white text-lg mb-4">
        Sharing: <span className="font-semibold">{file.name}</span> (by {file.sharerId === 'localUser' ? 'You' : `User ${file.sharerId}`})
      </p>
      {file.type === 'image' && (
        <img src={file.url} alt={file.name} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
      )}
      {file.type === 'video' && (
        <video src={file.url} controls autoPlay className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl">
          Your browser does not support the video tag.
        </video>
      )}
      {file.type === 'other' && (
        <div className="text-center p-10 bg-gray-700 rounded-lg">
          <p className="text-2xl">Cannot preview this file type.</p>
          <p className="text-gray-400">{file.name}</p>
        </div>
      )}
    </div>
  );
};

export default FileDisplay;
