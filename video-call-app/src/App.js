import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { BrowserRouter as Router, Route, Link, Switch, useParams } from 'react-router-dom';

const VideoCall = () => {
  const [myId, setMyId] = useState('');
  const [peer, setPeer] = useState(null);
  const [userStream, setUserStream] = useState(null);
  const [otherStreams, setOtherStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const myVideoRef = useRef();
  const remoteVideosRef = useRef({});

  useEffect(() => {
    const peerInstance = new Peer();
    setPeer(peerInstance);

    peerInstance.on('open', id => {
      setMyId(id);
    });

    peerInstance.on('call', call => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        setUserStream(stream);
        myVideoRef.current.srcObject = stream;
        call.answer(stream);
        call.on('stream', remoteStream => {
          addRemoteStream(call.peer, remoteStream);
        });
      });
    });

    return () => {
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (peer && userStream) {
      const roomId = window.location.pathname.split('/')[2];
      peer.connect(roomId);
      peer.on('connection', conn => {
        conn.on('data', data => {
          if (data.type === 'join') {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
              setUserStream(stream);
              myVideoRef.current.srcObject = stream;
              const call = peer.call(data.roomId, stream);
              call.on('stream', remoteStream => {
                addRemoteStream(call.peer, remoteStream);
              });
            });
          }
        });
      });
    }
  }, [peer, userStream]);

  const addRemoteStream = (peerId, stream) => {
    remoteVideosRef.current[peerId] = stream;
    setOtherStreams(Object.values(remoteVideosRef.current));
  };

  const toggleMute = () => {
    const audioTracks = userStream.getAudioTracks();
    audioTracks.forEach(track => (track.enabled = !isMuted));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    const videoTracks = userStream.getVideoTracks();
    videoTracks.forEach(track => (track.enabled = !isVideoOff));
    setIsVideoOff(!isVideoOff);
  };

  const leaveCall = () => {
    if (peer) {
      peer.destroy();
    }
    setUserStream(null);
    setOtherStreams([]);
  };

  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="my-video">
          <video ref={myVideoRef} autoPlay muted></video>
          <span>My Video</span>
        </div>
        {otherStreams.map((stream, index) => (
          <div key={index} className="remote-video">
            <video ref={el => (remoteVideosRef.current[index] = el)} autoPlay></video>
            <span>Participant {index + 1}</span>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
        <button onClick={toggleVideo}>{isVideoOff ? 'Turn Video On' : 'Turn Video Off'}</button>
        <button onClick={leaveCall}>Leave Call</button>
      </div>
    </div>
  );
};

const Home = () => {
  const [roomId, setRoomId] = useState('');

  const handleRoomJoin = () => {
    if (roomId) {
      window.location.href = `/call/${roomId}`;
    }
  };

  return (
    <div className="home">
      <h1>Video Call App</h1>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
      />
      <button onClick={handleRoomJoin}>Join Call</button>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/call/:roomId" component={VideoCall} />
      </Switch>
    </Router>
  );
};

export default App;
