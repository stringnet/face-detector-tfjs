// face-detector-client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// face-detector-client/src/App.jsx
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
