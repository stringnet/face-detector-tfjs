import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

export default function FaceDetectorTF() {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadModelAndCamera = async () => {
      try {
        await tf.ready();

        const model = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            maxFaces: 1,
            shouldLoadIrisModel: false,
          }
        );

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };

          const detect = async () => {
            const predictions = await model.estimateFaces({
              input: videoRef.current,
            });

            if (predictions.length > 0) {
              console.log('Predicciones:', predictions);
            }

            requestAnimationFrame(detect);
          };

          detect();
        }
      } catch (err) {
        console.error('Error inicial:', err);
        setError('Error cargando modelos o cámara');
      }
    };

    loadModelAndCamera();
  }, []);

  return (
    <div>
      <h1>FaceDetector (TensorFlow.js)</h1>
      <video ref={videoRef} width="640" height="480" autoPlay muted playsInline />
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
