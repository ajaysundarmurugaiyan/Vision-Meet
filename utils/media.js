// media.js
export const getLocalMediaStream = async () => {
  try {
    // Request access to video and audio
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    return stream;
  } catch (error) {
    console.error("Error accessing local media devices:", error);
    alert("Could not access camera/microphone. Check permissions.");
    return null;
  }
};