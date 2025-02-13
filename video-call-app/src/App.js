// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VideoCall from './components/VideoCall';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route to handle video call by room ID */}
        <Route path="/room/:roomId" element={<VideoCall />} />
      </Routes>
    </Router>
  );
}

export default App;
