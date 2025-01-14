// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { getSession, clearSession } from './utils/sessionManager';
import Login from './components/Login';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import CreateGroup from './components/CreateGroup';
import ChatRoom from './components/ChatRoom';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/navigation/Header';
import BottomNav from './components/navigation/BottomNav';

// Initialize socket without auth first
const socket = io(import.meta.env.VITE_BASE_URL_SOCKET);

// Create a wrapper component to use router hooks
const AppContent = ({ user, handleLogout, setUser }) => {
  const location = useLocation();
  const isChatRoom = location.pathname.includes('/room/');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} />
      <div className={isChatRoom ? '' : 'pt-14 pb-16'}>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/groups" /> : <Login setUser={setUser} socket={socket} />} 
          />
          <Route
            path="/groups"
            element={user ? <GroupList user={user} socket={socket} /> : <Navigate to="/" />}
          />
          <Route
            path="/group/create"
            element={user ? <CreateGroup user={user} socket={socket} /> : <Navigate to="/" />}
          />
          <Route
            path="/group/:groupId"
            element={user ? <GroupView user={user} socket={socket} /> : <Navigate to="/" />}
          />
          <Route
            path="/room/:roomId"
            element={user ? <ChatRoom user={user} socket={socket} /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/dashboard"
            element={user?.isAdmin ? <AdminDashboard user={user} socket={socket} /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <BottomNav user={user} onLogout={handleLogout} />
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const existingSession = getSession();
    if (existingSession) {
      setUser(existingSession);
      socket.auth = { userId: existingSession.id };
      socket.connect();
    }
    setIsConnecting(false);
  }, []);

  useEffect(() => {
    if (user) {
      socket.emit('user:connect', user);

      socket.on('session:expired', () => {
        clearSession();
        setUser(null);
      });
    }

    return () => {
      socket.off('session:expired');
    };
  }, [user]);

  const handleLogout = () => {
    if (user) {
      socket.emit('user:disconnect', user);
      clearSession();
      setUser(null);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent user={user} handleLogout={handleLogout} setUser={setUser} />
    </BrowserRouter>
  );
};

export default App;