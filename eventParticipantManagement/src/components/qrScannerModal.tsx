// import React, { useState } from "react";
// import { Camera, X } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import type { AppDispatch, RootState } from "../store";
// import { markAttendanceByQR } from "../store/slices/attendanceSlice";

// interface QRScannerModalProps {
//   column: {
//     id: string;
//     column_name: string;
//   };
//   onClose: () => void;
// }

// const QRScannerModal: React.FC<QRScannerModalProps> = ({ column, onClose }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { markingAttendance, error } = useSelector((state: RootState) => state.attendance);
//   const [qrInput, setQrInput] = useState('');

//   const handleMarkAttendance = () => {
//     if (qrInput.trim()) {
//       try {
//         // Parse QR code data (assuming JSON format from backend)
//         const qrData = JSON.parse(qrInput);
//         dispatch(markAttendanceByQR({ qrData, attendanceColumnId: column.id }));
//         onClose();
//       } catch (error) {
//         alert('Invalid QR code format');
//       }
//     }
//   };
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">Scan QR Code</h3>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
//             <p className="text-red-700 text-sm">{error}</p>
//           </div>
//         )}

//         <div className="bg-gray-100 p-8 rounded-lg text-center mb-4">
//           <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
//           <p className="text-gray-600">Camera scanner would appear here</p>
//           <p className="text-sm text-gray-500 mt-2">
//             Scanning for: {column?.column_name}
//           </p>
//         </div>

//         {/* Temporary QR input for testing */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Or paste QR data:
//           </label>
//           <input
//             type="text"
//             value={qrInput}
//             onChange={(e) => setQrInput(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//             placeholder='Paste QR JSON data here'
//           />
//         </div>

//         <div className="flex space-x-3">
//           <button
//             onClick={onClose}
//             className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
//             disabled={markingAttendance}
//           >
//             Cancel
//           </button>
//           <button 
//             onClick={handleMarkAttendance}
//             disabled={markingAttendance || !qrInput.trim()}
//             className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
//           >
//             {markingAttendance ? 'Marking...' : 'Mark Present'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QRScannerModal;


import React, { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { markAttendanceByQR } from "../store/slices/attendanceSlice";
import jsQR from "jsqr";

interface QRScannerModalProps {
  column: {
    id: string;
    column_name: string;
  };
  onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ column, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { markingAttendance, error } = useSelector((state: RootState) => state.attendance);
  const [qrInput, setQrInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);


  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      // Permissions API
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      if (result.state === "granted") return true; // already allowed
      return false;
    } catch {
      // fallback if Permissions API not supported
      return false;
    }
  };
  

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const hasPermission = await checkCameraPermission();
    
        if (!hasPermission) {
          console.log("Camera permission not granted. Requesting now...");
        }
    
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
    
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error or permission denied:", err);
        alert("Camera permission denied or camera not available.");
      }
    };
    

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // QR scanning loop
  // useEffect(() => {
  //   let animationId: number;

  //   const scan = () => {
  //     const video = videoRef.current;
  //     const canvas = canvasRef.current;
  //     if (video && canvas) {
  //       const ctx = canvas.getContext("2d");
  //       if (!ctx) return;

  //       canvas.width = video.videoWidth;
  //       canvas.height = video.videoHeight;
  //       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  //       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //       const code = jsQR(imageData.data, imageData.width, imageData.height);

  //       if (code && code.data) {
  //         try {
  //           const qrData = JSON.parse(code.data);
  //           dispatch(markAttendanceByQR({ qrData, attendanceColumnId: column.id }));
  //           onClose();
  //         } catch {
  //           console.warn("Invalid QR code detected");
  //         }
  //         return;
  //       }
  //     }
  //     animationId = requestAnimationFrame(scan);
  //   };

  //   scan();

  //   return () => cancelAnimationFrame(animationId);
  // }, [dispatch, column.id, onClose]);

  useEffect(() => {
    let animationId: number;
  
    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
  
        // Only scan if video has loaded its metadata (width/height > 0)
        if (video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
  
          if (code && code.data) {
            try {
              const qrData = JSON.parse(code.data);
              dispatch(markAttendanceByQR({ qrData, attendanceColumnId: column.id }));
              onClose();
              return;
            } catch {
              console.warn("Invalid QR code detected");
            }
          }
        }
      }
  
      animationId = requestAnimationFrame(scan);
    };
  
    animationId = requestAnimationFrame(scan);
  
    return () => cancelAnimationFrame(animationId);
  }, [dispatch, column.id, onClose]);
  

  const handleMarkAttendance = () => {
    if (qrInput.trim()) {
      try {
        const qrData = JSON.parse(qrInput);
        dispatch(markAttendanceByQR({ qrData, attendanceColumnId: column.id }));
        onClose();
      } catch {
        alert('Invalid QR code format');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-gray-100 p-2 rounded-lg text-center mb-4">
          <video ref={videoRef} className="w-full h-64 object-cover rounded" playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <p className="text-sm text-gray-500 mt-2">Scanning for: {column?.column_name}</p>
        </div>

        {/* Optional manual QR input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or paste QR data:
          </label>
          <input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder='Paste QR JSON data here'
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            disabled={markingAttendance}
          >
            Cancel
          </button>
          <button
            onClick={handleMarkAttendance}
            disabled={markingAttendance || !qrInput.trim()}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {markingAttendance ? 'Marking...' : 'Mark Present'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
