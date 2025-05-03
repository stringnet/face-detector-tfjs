import React from 'react';
import FaceDetector from './components/FaceDetector';

function App() {
  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>FaceDetector (TensorFlow.js)</h2>
      <FaceDetector />
    </div>
  );
}

export default App;
