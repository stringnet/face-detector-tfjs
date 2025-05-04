import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';

const FaceDetectorTF = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);

  const [status, setStatus] = useState('⏳ Cargando...');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatus("📦 Configurando backend...");
        await tf.setBackend('webgl');
        await tf.ready();

        setStatus("📦 Cargando modelo...");
        const model = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceDetector,
          {
            runtime: 'tfjs',
            maxFaces: 1,
          }
        );

        detectorRef.current = model;
        setStatus("✅ Modelo cargado");
        startVideo();
      } catch (err) {
        console.error("❌ Error al cargar el modelo:", err);
        setStatus("❌ Error al cargar modelo");
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            detectLoop();
            setStatus("🎥 Cámara activa");
          };
        }
      } catch (err) {
        console.error("❌ No se pudo acceder a la cámara:", err);
        setStatus("❌ No se pudo acceder a la cámara");
      }
    };

    const detectLoop = () => {
      const detect = async () => {
        if (
          videoRef.current &&
          detectorRef.current &&
          videoRef.current.readyState === 4
        ) {
          const faces = await detectorRef.current.estimateFaces(videoRef.current);

          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (faces.length > 0) {
            setMessage('✅ Rostro detectado');
            faces.forEach(face => {
              const box = face.box;
              context.beginPath();
              context.rect(box.xMin, box.yMin, box.width, box.height);
              context.strokeStyle = 'lime';
              context.lineWidth = 2;
              context.stroke();
            });
          } else {
            setMessage('🔍 Buscando rostro...');
          }
        }
        requestAnimationFrame(detect);
      };
      detect();
    };

    loadModel();
  }, []);

  return (
    <div style={{ position: 'relative', width: 320, height: 240 }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="320"
        height="240"
        style={{ position: 'absolute', zIndex: 1 }}
      />
      <canvas
        ref={canvasRef}
        width="320"
        height="240"
        style={{ position: 'absolute', zIndex: 2 }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 5,
          left: 5,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 3,
          fontSize: '13px',
        }}
      >
        {status}
      </div>
      {message && (
        <div
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            zIndex: 3,
            fontSize: '13px',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default FaceDetectorTF;
