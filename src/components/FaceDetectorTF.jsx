import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

const FaceDetectorTF = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  const [status, setStatus] = useState('⏳ Cargando...');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatus("📦 Configurando backend...");
        await tf.setBackend('webgl');
        await tf.ready();

        setStatus("📦 Cargando modelo BlazeFace...");
        const model = await blazeface.load();
        modelRef.current = model;

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
          modelRef.current &&
          videoRef.current.readyState === 4
        ) {
          const predictions = await modelRef.current.estimateFaces(videoRef.current, false);
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (predictions.length > 0) {
            setMessage('✅ Rostro detectado');
            predictions.forEach(prediction => {
              const start = prediction.topLeft;
              const end = prediction.bottomRight;
              const size = [end[0] - start[0], end[1] - start[1]];

              context.beginPath();
              context.rect(start[0], start[1], size[0], size[1]);
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
