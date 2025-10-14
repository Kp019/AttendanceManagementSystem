import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  Plus,
  QrCode,
  LogOut,
  Users,
  UserPlus,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { fetchEventById } from "../store/slices/eventsSlice";
import {
  fetchParticipants,
  uploadParticipantsCsv,
  downloadQRCodesZip,
  addParticipant,
} from "../store/slices/participantsSlice";
import {
  fetchAttendanceColumns,
  createAttendanceColumn,
} from "../store/slices/attendanceSlice";
import { logout } from "../store/slices/authSlice";
import ParticipantTable from "../components/ParticipantTable";

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { selectedEvent: event } = useSelector(
    (state: RootState) => state.events
  );
  const { list: participants, uploadLoading } = useSelector(
    (state: RootState) => state.participants
  );
  const { columns: attendanceColumns, loading: columnsLoading } = useSelector(
    (state: RootState) => state.attendance
  );

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    email: "",
    phone: "",
  });
  // const [renderParticipantList, setRenderParticipantList] = useState(false);

  useEffect(() => {
    console.log(isAuthenticated, "isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const token = localStorage.getItem("token") || "";

    if (id) {
      dispatch(fetchEventById({ eventId: id, token }));
      dispatch(fetchParticipants(id));
      dispatch(fetchAttendanceColumns(id));
    }
  }, [id, isAuthenticated, dispatch, navigate]);
    // Removed token from dependencies and pass as object to fetchEventById


  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && id) {
      dispatch(uploadParticipantsCsv({ eventId: id, csvFile: file }));
    }
  };

  const handleDownloadQRCodes = () => {
    if (id) {
      dispatch(downloadQRCodesZip(id));
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim() && id) {
      dispatch(
        createAttendanceColumn({
          eventId: id,
          columnName: newColumnName.trim(),
        })
      );
      setNewColumnName("");
      setShowAddColumn(false);
    }
  };

  const handleAddParticipant = () => {
    if (
      newParticipant.name.trim() &&
      newParticipant.email.trim() &&
      newParticipant.phone.trim() &&
      id
    ) {
      dispatch(
        addParticipant({
          eventId: id,
          participant: newParticipant,
        })
      );
      setNewParticipant({ name: "", email: "", phone: "" });
      setShowAddParticipant(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate("/events")}
              className="text-indigo-600 hover:text-indigo-800 mb-2"
            >
              ← Back to Events
            </button>
            {event ? (
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            ) : (
              <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/events/${id}/attendance`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Attendance Management</span>
            </button>
            <input
              type="file"
              id="csv-upload"
              className="hidden"
              accept=".csv"
              onChange={handleCsvUpload}
            />
            <button
              onClick={() => document.getElementById("csv-upload")?.click()}
              disabled={uploadLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>{uploadLoading ? "Uploading..." : "Upload CSV"}</span>
            </button>
            <button
              onClick={handleDownloadQRCodes}
              disabled={participants.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Download QR Codes</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Attendance Columns */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Attendance Tracking
            </h2>
            <button
              onClick={() => setShowAddColumn(true)}
              disabled={columnsLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Add Column</span>
            </button>
          </div>

          {columnsLoading ? (
            <div className="text-center text-gray-500">
              Loading attendance columns...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {attendanceColumns.map((column) => (
                <button
                  key={column.id}
                  onClick={() =>
                    navigate(`/events/${id}/attendance`, {
                      state: { selectedColumn: column },
                    })
                  }
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center"
                >
                  <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {column.column_name}
                  </p>
                  <p className="text-xs text-gray-500">Click to manage</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Participants
              </h2>
              <button
                onClick={() => setShowAddParticipant(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Participant</span>
              </button>
            </div>
          </div>
          <ParticipantTable
            participants={participants}
            attendanceColumns={attendanceColumns}
          />
        </div>
      </main>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Attendance Column
              </h3>
              <button
                onClick={() => setShowAddColumn(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-5 w-5 transform rotate-45" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="columnName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Column Name
                </label>
                <input
                  id="columnName"
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Day 1 Lunch"
                  onKeyPress={(e) => e.key === "Enter" && handleAddColumn()}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddColumn(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddColumn}
                  disabled={!newColumnName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Column
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Participant
              </h3>
              <button
                onClick={() => setShowAddParticipant(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-5 w-5 transform rotate-45" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="participantName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name *
                </label>
                <input
                  id="participantName"
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) =>
                    setNewParticipant({
                      ...newParticipant,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter participant name"
                />
              </div>
              <div>
                <label
                  htmlFor="participantEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email *
                </label>
                <input
                  id="participantEmail"
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) =>
                    setNewParticipant({
                      ...newParticipant,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label
                  htmlFor="participantPhone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone *
                </label>
                <input
                  id="participantPhone"
                  type="tel"
                  value={newParticipant.phone}
                  onChange={(e) =>
                    setNewParticipant({
                      ...newParticipant,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddParticipant(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParticipant}
                  disabled={
                    !newParticipant.name.trim() ||
                    !newParticipant.email.trim() ||
                    !newParticipant.phone.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Participant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
