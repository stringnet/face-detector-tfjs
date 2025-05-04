import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const FaceDetectorTF = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('⏳ Cargando modelo...');
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const faceLandmarksDetection = await import('@tensorflow-models/face-landmarks-detection');
        const model = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
        );
        setModel(model);
        setStatus('✅ Modelo cargado');
        startVideo();
      } catch (err) {
        console.error('❌ Error al cargar el modelo:', err);
        setStatus('❌ Error al cargar el modelo');
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              detectFaces(); // Inicia detección después de reproducir
            };
          }
          setStatus('🎥 Cámara activa');
        })
        .catch((err) => {
          console.error('❌ No se pudo acceder a la cámara:', err);
          setStatus('❌ Cámara no disponible');
        });
    };

    const detectFaces = async () => {
      if (!model || !videoRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const runDetection = async () => {
        const predictions = await model.estimateFaces({
          input: video,
          returnTensors: false,
          flipHorizontal: false,
          predictIrises: false
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
          for (const prediction of predictions) {
            const [x, y, width, height] = prediction.boundingBox.topLeft.concat(prediction.boundingBox.bottomRight).flat();
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width - x, height - y);
          }
        }

        requestAnimationFrame(runDetection);
      };

      runDetection();
    };

    loadModel();
  }, []);

  return (
    <div style={{ position: 'relative', width: 640, height: 480 }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
      />
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '6px',
        zIndex: 3
      }}>
        {status}
      </div>
    </div>
  );
};

export default FaceDetectorTF;
