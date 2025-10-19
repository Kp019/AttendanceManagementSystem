import React, { useEffect } from "react";
import { QrCode, Users, Calendar, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { logout } from "../hooks/authActions";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  console.log(isAuthenticated, 'qwerty')
  useEffect(()=>{
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate])


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">EventQR</h1>
          </div>
          <nav className="flex items-center space-x-6">
            <button
              onClick={() => navigate("/events")}
              className="text-gray-600 hover:text-indigo-600 font-medium"
            >
              Events
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate("/users")}
                className="text-gray-600 hover:text-indigo-600 font-medium"
              >
                Users
              </button>
            )}
            <div className="flex items-center space-x-2">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{user?.name || 'User'}</span>
              </button>
              <button 
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Streamline Your Event Management
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Manage participants, track attendance, and handle food distribution with QR codes.
        </p>
        <button
          onClick={() => navigate("/events")}
          className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Get Started
        </button>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard icon={<QrCode className="h-8 w-8 text-indigo-600" />} title="QR Code Attendance" desc="Generate unique QR codes for participants and track attendance easily." />
          <FeatureCard icon={<Users className="h-8 w-8 text-green-600" />} title="Participant Management" desc="Upload CSVs, manage participant data, and handle registrations efficiently." />
          <FeatureCard icon={<Calendar className="h-8 w-8 text-purple-600" />} title="Multi-Session Events" desc="Track attendance for meals, sessions, and activities with ease." />
        </div>
      </main>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-xl shadow-lg">
    <div className="bg-gray-100 p-3 rounded-lg w-fit mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

export default HomePage;
