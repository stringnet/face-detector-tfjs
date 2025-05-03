// src/components/FaceDetectorTF.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

export default function FaceDetectorTF() {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const runFaceDetection = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();

        // Usamos directamente los valores como string, más seguro
        const model = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh || 'mediapipeFacemesh'
        );

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        const detect = async () => {
          const predictions = await model.estimateFaces({ input: videoRef.current });
          console.log('Predicciones:', predictions);
          requestAnimationFrame(detect);
        };

        videoRef.current.onloadeddata = detect;
      } catch (err) {
        console.error('Error inicial:', err);
        setError('Error cargando modelos o cámara');
      }
    };

    runFaceDetection();
  }, []);

  return (
    <div>
      <h1>FaceDetector (TensorFlow.js)</h1>
      <video ref={videoRef} autoPlay playsInline width="720" height="560" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
