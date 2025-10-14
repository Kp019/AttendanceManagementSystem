import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { X, Camera, Users, CheckCircle, AlertCircle } from "lucide-react";
import type { RootState, AppDispatch } from "../store";
import { fetchEventById } from "../store/slices/eventsSlice";
import { fetchParticipants } from "../store/slices/participantsSlice";
import { 
  fetchAttendanceColumns, 
  markAttendanceByQR, 
  clearError 
} from "../store/slices/attendanceSlice";
import jsQR from "jsqr";

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  attendance?: AttendanceRecord[];
}

interface AttendanceRecord {
  attendance_column_id: string;
  status: boolean;
  attendance_columns?: {
    column_name: string;
  };
}

export const AttendateManagement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { selectedEvent: event } = useSelector((state: RootState) => state.events);
  const { list: participants } = useSelector((state: RootState) => state.participants);
  const { 
    columns: attendanceColumns, 
    error 
  } = useSelector((state: RootState) => state.attendance);

  // Camera and QR scanning state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<{id: string; column_name: string} | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (id) {
      dispatch(fetchEventById(id));
      dispatch(fetchParticipants(id));
      dispatch(fetchAttendanceColumns(id));
    }
  }, [id, isAuthenticated, dispatch, navigate]);

  // Auto-select column from navigation state
  useEffect(() => {
    const state = location.state as { selectedColumn?: {id: string; column_name: string} } | null;
    if (state?.selectedColumn) {
      setSelectedColumn(state.selectedColumn);
      setScanning(true);
      dispatch(clearError());
    }
  }, [location.state, dispatch]);

  // Camera permission check
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      if (result.state === "granted") return true;
      return false;
    } catch {
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
        setCameraError(null);
      } catch (err) {
        console.error("Camera error or permission denied:", err);
        setCameraError("Camera permission denied or camera not available.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // QR scanning loop
  useEffect(() => {
    if (!scanning || !selectedColumn) return;

    let animationId: number;

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.videoWidth && video.videoHeight) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          try {
            const qrData = JSON.parse(code.data);
            // Check if this is a valid participant QR code for this event
            if (qrData.event_id === id && qrData.participant_id) {
              dispatch(markAttendanceByQR({ 
                qrData, 
                attendanceColumnId: selectedColumn.id 
              }));
              
              // Show success feedback
              const participant = participants.find(p => p.id === qrData.participant_id);
              setLastScanned(participant?.name || 'Unknown');
              
              // Reset after 3 seconds
              setTimeout(() => setLastScanned(null), 3000);
            }
          } catch {
            console.warn("Invalid QR code detected");
          }
        }
      }

      if (scanning) {
        animationId = requestAnimationFrame(scan);
      }
    };

    animationId = requestAnimationFrame(scan);

    return () => cancelAnimationFrame(animationId);
  }, [scanning, selectedColumn, dispatch, id, participants]);

  const startScanning = (column: {id: string; column_name: string}) => {
    setSelectedColumn(column);
    setScanning(true);
    dispatch(clearError());
  };

  const stopScanning = () => {
    setScanning(false);
    setSelectedColumn(null);
    setLastScanned(null);
  };

  const getParticipantAttendanceStatus = (participant: Participant, columnId: string) => {
    if (!participant.attendance) return false;
    const record = participant.attendance.find((a: AttendanceRecord) => a.attendance_column_id === columnId);
    return record?.status || false;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!event) {
    return (
      <div className="p-10 text-center text-red-600 text-lg">
        Event not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-[100vh] overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate("/events")}
              className="text-indigo-600 hover:text-indigo-800 mb-2"
            >
              ← Back to Events
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600">{event.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Camera and Controls */}
          <div className="space-y-6 h-[80vh] bg-green-500">
            {/* Camera Section */}
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  QR Scanner
                </h2>
                {scanning && (
                  <button
                    onClick={stopScanning}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Stop Scanning</span>
                  </button>
                )}
              </div>

              {/* Camera Feed */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <video 
                  ref={videoRef} 
                  className="w-full h-64 object-cover" 
                  playsInline 
                  muted 
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center text-white">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">{cameraError}</p>
                    </div>
                  </div>
                )}

                {scanning && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-green-500 rounded-lg w-48 h-48 flex items-center justify-center">
                      <div className="text-center text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Scanning for QR codes...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Success Message */}
              {lastScanned && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <p className="text-green-700">
                      Successfully marked attendance for <strong>{lastScanned}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Current Column Info */}
              {selectedColumn && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">
                        Currently Scanning: {selectedColumn.column_name}
                      </h3>
                      <p className="text-sm text-blue-700">
                        Show participant QR code to mark attendance
                      </p>
                    </div>
                    <button
                      onClick={stopScanning}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Column Selection */}
              {!selectedColumn && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Select Attendance Column:</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {attendanceColumns.map((column) => (
                      <button
                        key={column.id}
                        onClick={() => startScanning(column)}
                        className="p-4 border-2 border-gray-300 rounded-lg text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        <span className="font-medium text-gray-700">{column.column_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Participants Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participants ({participants.length})
              </h2>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No participants found for this event.</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto lg:h-[70vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      {attendanceColumns.map((column) => (
                        <th key={column.id} className={`px-3 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                          selectedColumn?.id === column.id 
                            ? 'text-blue-600 bg-blue-50' 
                            : 'text-gray-500'
                        }`}>
                          {column.column_name}
                          {selectedColumn?.id === column.id && (
                            <div className="text-xs text-blue-500 mt-1">(Active)</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {participant.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {participant.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {participant.phone}
                          </div>
                        </td>
                        {attendanceColumns.map((column) => (
                          <td key={column.id} className="px-3 py-4 whitespace-nowrap text-center">
                            {getParticipantAttendanceStatus(participant, column.id) ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};