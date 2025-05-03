// face-detector-tfjs/src/components/FaceDetectorTF.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

const EMOTION_MESSAGES = {
  happy: "¡Qué bueno verte feliz! ¿Listo para crear algo genial?",
  sad: "Recuerda que incluso los días nublados pueden terminar con un gran atardecer.",
  neutral: "¡Hola! ¿Cómo estás?"
};

const FaceDetectorTF = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Cargando modelos...");
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    let detector;
    let interval;

    const loadModelAndStart = async () => {
      try {
        await tf.ready();
        detector = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
        );
        setStatus("Modelos cargados. Activando cámara...");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStatus("Cámara activa");
        };

        interval = setInterval(() => detect(detector), 1000);
      } catch (err) {
        console.error("Error inicial:", err);
        setStatus("Error cargando modelos o cámara");
      }
    };

    const detect = async (detector) => {
      if (!videoRef.current) return;
      const predictions = await detector.estimateFaces({ input: videoRef.current });
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (predictions.length > 0) {
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        predictions.forEach(pred => {
          const [x, y, w, h] = pred.boundingBox.topLeft.concat(pred.boundingBox.bottomRight).flat();
          ctx.strokeRect(x, y, w - x, h - y);
        });

        if (!hasGreeted) {
          const msg = EMOTION_MESSAGES["neutral"];
          sendToEspectro(msg);
          setHasGreeted(true);
        }
      }
    };

    loadModelAndStart();
    return () => clearInterval(interval);
  }, [hasGreeted]);

  const sendToEspectro = async (text) => {
    try {
      const res = await fetch("https://espectroapi.scanmee.io/ws-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      console.log("Mensaje enviado:", data);
    } catch (err) {
      console.error("Error al enviar al espectro:", err);
    }
  };

  return (
    <div style={{ position: 'relative', width: 320, height: 240 }}>
      <video ref={videoRef} autoPlay muted width="320" height="240" style={{ position: 'absolute', zIndex: 1 }} />
      <canvas ref={canvasRef} width="320" height="240" style={{ position: 'absolute', zIndex: 2 }} />
      <div style={{
        position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
        padding: '4px 8px', borderRadius: '6px', zIndex: 3, fontSize: '13px'
      }}>{status}</div>
    </div>
  );
};

export default FaceDetectorTF;
