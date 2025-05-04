import React, { useEffect, useRef, useState } from 'react';
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
  const [status, setStatus] = useState("⏳ Cargando...");
  const [message, setMessage] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const modelRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatus("📦 Cargando modelo...");
        const model = await faceLandmarksDetection.load('mediapipeFacemesh');
        modelRef.current = model;
        setStatus("✅ Modelo cargado");
        startVideo();
      } catch (err) {
        console.error("❌ Error al cargar el modelo:", err);
        setStatus("❌ Error al cargar modelo");
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setStatus("🎥 Cámara activa");
            };
          }
        })
        .catch((err) => {
          console.error("❌ Error al acceder a la cámara:", err);
          setStatus("❌ No se pudo acceder a la cámara");
        });
    };

    const detectFace = async () => {
      if (!videoRef.current || !modelRef.current) return;

      const predictions = await modelRef.current.estimateFaces({
        input: videoRef.current
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        ctx.strokeStyle = "#0f0";
        ctx.lineWidth = 2;
        predictions.forEach(pred => {
          const [x, y, width, height] = pred.boundingBox;
          ctx.strokeRect(x, y, width, height);
        });

        setMessage("✅ Rostro detectado");

        if (!hasGreeted) {
          const msg = EMOTION_MESSAGES.happy;
          await sendToEspectro(msg);
          setHasGreeted(true);
          startRecordingAndSend();
        }
      } else {
        setMessage("🔍 Buscando rostro...");
      }
    };

    loadModel();
    const interval = setInterval(() => detectFace(), 1000);
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
      console.log("📤 Mensaje enviado:", data);
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
    }
  };

  const startRecordingAndSend = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'input.webm');

        try {
          const res = await fetch('https://espectroapi.scanmee.io/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          console.log("📨 Transcripción:", data);
        } catch (err) {
          console.error("❌ Error al transcribir:", err);
        }
      };

      mediaRecorder.start();
      console.log("🎙 Grabando audio...");
      setTimeout(() => {
        mediaRecorder.stop();
        console.log("🛑 Grabación finalizada");
      }, 5000);
    } catch (err) {
      console.error("❌ No se pudo grabar audio:", err);
    }
  };

  return (
    <div style={{ position: 'relative', width: 320, height: 240 }}>
      <video ref={videoRef} autoPlay muted width="320" height="240" style={{ position: 'absolute', zIndex: 1 }} />
      <canvas ref={canvasRef} width="320" height="240" style={{ position: 'absolute', zIndex: 2 }} />
      <div style={{
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '6px',
        zIndex: 3,
        fontSize: '13px'
      }}>
        {status}
      </div>
      {message && (
        <div style={{
          position: 'absolute',
          top: 5,
          left: 5,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 3,
          fontSize: '13px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FaceDetectorTF;
