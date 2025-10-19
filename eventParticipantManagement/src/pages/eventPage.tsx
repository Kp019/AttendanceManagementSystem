import React, { useEffect, useState } from "react";
import { Plus, Users, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { fetchEvents, createEvent } from "../store/slices/eventsSlice";
import { logout } from "../hooks/authActions";
import CreateEventForm from "../components/CreateEventForm";
import api from "../hooks/http";

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    list: events,
    loading,
    error,
  } = useSelector((state: RootState) => state.events);
  const [showCreateModal, setShowCreateModal] = useState(false);

  
  useEffect(() => {
    console.log(events, user, "qwerty");
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    api.get("/events").then((response) => {
      console.log(response.data, "response");
    });
    dispatch(fetchEvents());
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-indigo-600"
            >
              Home
            </button>
            {user?.role === "admin" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Event</span>
              </button>
            )}
            <div className="flex items-center space-x-2">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{user?.name || "User"}</span>
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid gap-6">
        {loading && (
          <div className="text-center text-gray-500">Loading events...</div>
        )}
        {error && <div className="text-center text-red-600">{error}</div>}
        {!loading &&
          !error &&
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <span className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>
                      {Array.isArray(event.participants)
                        ? event.participants[0]?.count ?? 0
                        : 0}{" "}
                      participants
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/events/${event.uuid}`)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Manage Event
                </button>
              </div>
            </div>
          ))}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Event</h3>
            <CreateEventForm
              onClose={() => setShowCreateModal(false)}
              onCreate={(payload) => {
                const eventPayload = { ...payload, uuid: "" }; // Ensure uuid is included
                dispatch(createEvent(eventPayload));
                setShowCreateModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
