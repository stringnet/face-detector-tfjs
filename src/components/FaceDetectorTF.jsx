import React, { useEffect, useRef, useState, useCallback } from 'react';
import * *as* tf from '@tensorflow/tfjs';
// Importa explícitamente el backend que vas a usar
import '@tensorflow/tfjs-backend-webgl';
import * *as* faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Modelo subyacente que face-landmarks-detection usa por defecto con el paquete tfjs.
// Es útil saberlo por si buscas errores específicos de MediaPipe.
// import '@mediapipe/face_mesh'; // A menudo no necesitas importarlo explícitamente si usas el paquete tfjs, pero tenerlo no daña.

const FaceDetectorTF = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  // Ref para controlar el bucle de detección y evitar múltiples inicios
  const animationFrameId = useRef(null);

  const [status, setStatus] = useState('⏳ Inicializando...');
  const [message, setMessage] = useState('');
  const [isDetecting, setIsDetecting] = useState(false); // Estado para controlar si la detección está activa

  // --- Función de Detección ---
  // Usamos useCallback para evitar recrearla en cada render, aunque aquí no es estrictamente necesario
  // porque está dentro de useEffect con [], pero es buena práctica.
  const detectFaces = useCallback(async () => {
    // Asegurarse de que el video y el modelo estén listos y que la detección no esté ya corriendo
    if (
      videoRef.current &&
      modelRef.current &&
      videoRef.current.readyState >= 3 && // readyState 3 (HAVE_FUTURE_DATA) o 4 (HAVE_ENOUGH_DATA) suele ser suficiente
      !isDetecting // Evita ejecuciones concurrentes si la anterior no ha terminado
    ) {
      setIsDetecting(true); // Marcar que la detección ha comenzado
      setStatus("👁️ Analizando video...");

      try {
        const predictions = await modelRef.current.estimateFaces({
          input: videoRef.current,
          // Opcional: Parámetros adicionales si son necesarios
          // flipHorizontal: false, // Por defecto es false, ajústalo si tu video está espejado
        });

        const canvas = canvasRef.current;
        if (!canvas) {
          console.error("Referencia del Canvas no encontrada.");
          setIsDetecting(false);
          return; // Salir si no hay canvas
        }
        const context = canvas.getContext('2d');

        // Ajustar tamaño del canvas al del video si no coinciden (importante para dibujar correctamente)
        if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
        }

        // Limpiar canvas antes de dibujar nuevas predicciones
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
          setMessage(`✅ Rostro detectado (${predictions.length})`);
          // Dibujar los landmarks (opcional, puedes quitarlo si solo necesitas saber si hay rostro)
          predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh; // Coordenadas relativas al tamaño del video
            context.fillStyle = 'rgba(0, 255, 0, 0.7)'; // Verde semitransparente
            context.beginPath();
            keypoints.forEach(([x, y]) => { // Usar [x, y] directamente
              context.rect(x - 1, y - 1, 2, 2); // Dibujar pequeños cuadrados en lugar de círculos (más eficiente)
            });
            context.fill();
          });
        } else {
          setMessage('⚪ No se detecta rostro');
        }
      } catch (error) {
        console.error("❌ Error durante la detección de rostros:", error);
        setStatus("⚠️ Error en detección");
        // Considerar detener el bucle si hay errores repetidos
      } finally {
        setIsDetecting(false); // Marcar que la detección ha terminado
      }
    }

    // Solicitar el siguiente frame para continuar el bucle
    // Asegúrate de que el componente sigue montado
    if (videoRef.current && modelRef.current) {
       animationFrameId.current = requestAnimationFrame(detectFaces);
    }
  }, [isDetecting]); // Dependencia para evitar ejecuciones concurrentes

  // --- Función para Iniciar Video y Detección ---
  const startVideoAndDetection = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("❌ Error: getUserMedia no soportado");
      console.error("getUserMedia no está soportado en este navegador.");
      return;
    }

    setStatus("🎥 Solicitando acceso a la cámara...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 320, // Solicitar un tamaño específico puede ayudar
          height: 240
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Esperar a que los metadatos del video (dimensiones) estén cargados
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setStatus("🚀 ¡Cámara activa! Iniciando detección...");
            // Iniciar el bucle de detección
            // Cancelar cualquier frame anterior antes de iniciar uno nuevo
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
            animationFrameId.current = requestAnimationFrame(detectFaces);
          }).catch(playError => {
            console.error("❌ Error al iniciar reproducción del video:", playError);
            setStatus("❌ Error al reproducir video");
          });
        };
      }
    } catch (err) {
      console.error("❌ Error al acceder a la cámara:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("🚫 Permiso de cámara denegado");
        setMessage("Por favor, permite el acceso a la cámara.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
         setStatus("❌ No se encontró cámara");
         setMessage("Asegúrate de que una cámara esté conectada y habilitada.");
      } else {
        setStatus("❌ Error de cámara");
      }
    }
  }, [detectFaces]); // detectFaces es dependencia de useCallback

  // --- Efecto Principal para Cargar Modelo e Iniciar ---
  useEffect(() => {
    let isMounted = true; // Flag para verificar si el componente sigue montado

    const initialize = async () => {
      try {
        setStatus("🚦 Preparando TensorFlow.js...");
        // 1. Establecer backend (WebGL es preferido para rendimiento)
        await tf.setBackend('webgl');
        // 2. Esperar a que el backend esté listo
        await tf.ready();
        console.log(`✅ Backend TFJS activo: ${tf.getBackend()}`);
        setStatus("🧠 Backend listo. Cargando modelo...");

        // 3. Cargar el modelo de detección de landmarks faciales
        // IMPORTANTE: Si esto falla en producción, revisa la consola del navegador.
        // Las causas comunes son:
        //    - CORS: Si el modelo se carga desde un CDN (como tfhub.dev) y tu servidor no lo permite.
        //            Solución: Aloja los archivos del modelo en tu propio dominio.
        //    - Red: Archivos del modelo no encontrados (404) o problemas de red.
        //    - Memoria: El modelo es demasiado grande para el dispositivo/navegador.
        const model = await faceLandmarksDetection.load(
          // Usar el paquete pre-configurado (tfjs o mediapipe)
          faceLandmarksDetection.SupportedPackages.tfjs, // o .mediapipeFacemesh
          {
            maxFaces: 1, // Detectar solo una cara
            shouldLoadIrisModel: false, // No cargar el modelo de iris (más ligero)
            // modelUrl: '/path/to/your/hosted/model.json' // DESCOMENTA si alojas el modelo tú mismo
          }
        );

        if (!isMounted) return; // Salir si el componente se desmontó mientras cargaba

        modelRef.current = model;
        setStatus("✅ Modelo cargado exitosamente");

        // 4. Iniciar el video y el bucle de detección
        startVideoAndDetection();

      } catch (err) {
        console.error("❌ Error Crítico - Falló la inicialización:", err);
        // Intentar dar mensajes más específicos basados en el error
        if (err.message.includes("CORS") || err.message.includes("opaque")) {
             setStatus("❌ Error CORS al cargar modelo");
             setMessage("Revisa la configuración del servidor o aloja el modelo localmente.");
        } else if (err.message.includes("404")) {
             setStatus("❌ Error 404 - Modelo no encontrado");
             setMessage("Verifica la URL o disponibilidad del modelo.");
        } else if (err.message.includes("WebGL")) {
             setStatus("❌ Error de WebGL");
             setMessage("Tu navegador/dispositivo podría no ser compatible.");
        } else {
            setStatus("❌ Error al cargar/configurar TFJS/Modelo");
        }
        // Imprimir el error completo para depuración
        console.error("Detalles del error:", err);
      }
    };

    initialize();

    // --- Función de Limpieza ---
    // Se ejecuta cuando el componente se desmonta
    return () => {
      isMounted = false; // Marcar como desmontado
      console.log("🧹 Limpiando recursos...");
      // Detener el bucle de animación
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Detener el stream de video
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log("✔️ Stream de video detenido.");
      }
      // Liberar el modelo de la memoria (si está cargado)
      if (modelRef.current && typeof modelRef.current.dispose === 'function') {
        modelRef.current.dispose();
        modelRef.current = null;
        console.log("✔️ Modelo TFJS liberado.");
      }
      // Considerar limpiar tensores si se crean fuera de tf.tidy() (no es el caso aquí)
      // console.log(`Número de tensores restantes: ${tf.memory().numTensors}`);
    };
  }, [startVideoAndDetection]); // startVideoAndDetection es dependencia de useCallback

  return (
    <div style={{ position: 'relative', width: 320, height: 240, border: '1px solid #ccc', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline // Importante para iOS
        muted // Silenciado para autoplay sin interacción del usuario
        width="320"
        height="240"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover', // Cubrir el área sin distorsionar
          transform: 'scaleX(-1)', // Espejar horizontalmente (como un espejo) - AJUSTA SI ES NECESARIO
          zIndex: 1
        }}
      />
      <canvas
        ref={canvasRef}
        width="320"
        height="240"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)', // Espejar igual que el video
          zIndex: 2
         }}
      />
      {/* Status Box */}
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
          fontSize: '12px', // Ligeramente más pequeño
          maxWidth: 'calc(100% - 10px)' // Evitar que se salga
        }}
      >
        {status}
      </div>
      {/* Message Box */}
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
            fontSize: '12px',
            maxWidth: 'calc(100% - 10px)'
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default FaceDetectorTF;
