// src/components/VideoCall.js
import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import './VideoCall.css';

// Connect to the signaling server
const socket = io('http://localhost:5000');

const VideoCall = () => {
  const { roomId } = useParams();  // Get the roomId from the URL
  const [peer, setPeer] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Generate a unique user ID on mount
  useEffect(() => {
    setUserId(Math.random().toString(36).substring(7)); // Simple unique ID generation
  }, []);

  // Get user media (video and audio stream)
  useEffect(() => {
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        const newPeer = new Peer({
          initiator: true,
          trickle: false,
          stream,
        });

        newPeer.on('signal', (signalData) => {
          socket.emit('signal', { roomId, userId, signalData });
        });

        newPeer.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
          remoteVideoRef.current.srcObject = remoteStream;
        });

        setPeer(newPeer);
      } catch (error) {
        console.error('Error accessing user media:', error);
      }
    };

    if (roomId) {
      getLocalStream();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, userId]);

  // Join the room when the component mounts
  useEffect(() => {
    if (userId && roomId) {
      socket.emit('join-room', roomId, userId);
    }
  }, [userId, roomId]);

  // Handle incoming signaling data
  useEffect(() => {
    socket.on('signal', (data) => {
      const { userId, signalData } = data;
      if (signalData.type === 'offer') {
        const newPeer = new Peer({
          initiator: false,
          trickle: false,
        });

        newPeer.on('signal', (signal) => {
          socket.emit('signal', { roomId, userId, signalData: signal });
        });

        newPeer.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
          remoteVideoRef.current.srcObject = remoteStream;
        });

        newPeer.signal(signalData);
        setPeer(newPeer);
      }

      if (signalData.type === 'answer') {
        peer.signal(signalData);
      }

      if (signalData.type === 'ice-candidate') {
        peer.signal(signalData);
      }
    });

    socket.on('user-connected', (newUserId) => {
      console.log(`${newUserId} joined the room.`);
    });

    return () => {
      socket.off('signal');
      socket.off('user-connected');
    };
  }, [peer, roomId]);

  // Mute/Unmute Audio
  const toggleMute = () => {
    const tracks = localStream.getTracks();
    tracks.forEach((track) => {
      if (track.kind === 'audio') track.enabled = !track.enabled;
    });
  };

  // Turn On/Off Video
  const toggleVideo = () => {
    const tracks = localStream.getTracks();
    tracks.forEach((track) => {
      if (track.kind === 'video') track.enabled = !track.enabled;
    });
  };

  // Leave the call
  const leaveCall = () => {
    socket.emit('disconnect');
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    peer.destroy();
  };

  return (
    <div className="video-call">
      <div className="video-tiles">
        <div className="tile">
          <h2>{username || userId}</h2> {/* Display username or userId */}
          <video ref={localVideoRef} autoPlay muted />
        </div>
        {remoteStream && (
          <div className="tile">
            <h2>Participant</h2> {/* You can dynamically update participant name here */}
            <video ref={remoteVideoRef} autoPlay />
          </div>
        )}
      </div>
      <div className="controls">
        <button onClick={toggleMute}>Mute</button>
        <button onClick={toggleVideo}>Turn Video Off</button>
        <button onClick={leaveCall}>Leave Call</button>
      </div>
    </div>
  );
};

export default VideoCall;
