import { Navigate } from 'react-router-dom';
import Login from '../components/Login';
import GroupList from '../components/GroupList';
import GroupView from '../components/GroupView';
import CreateGroup from '../components/CreateGroup';
import RoomList from '../components/RoomList';
import CreateRoom from '../components/CreateRoom';
import ChatRoom from '../components/ChatRoom';
import AdminDashboard from '../components/AdminDashboard';

// Auth Guard Component
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Admin Guard Component
const AdminRoute = ({ children, user }) => {
  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const routes = (user, socket) => [
  {
    path: "/",
    element: user ? (
      <Navigate to="/groups" />
    ) : (
      <Login setUser={setUser} socket={socket} />
    )
  },
  {
    path: "/groups",
    element: (
      <ProtectedRoute user={user}>
        <GroupList user={user} socket={socket} />
      </ProtectedRoute>
    )
  },
  {
    path: "/group/create",
    element: (
      <ProtectedRoute user={user}>
        <CreateGroup user={user} socket={socket} />
      </ProtectedRoute>
    )
  },
  {
    path: "/group/:groupId",
    element: (
      <ProtectedRoute user={user}>
        <GroupView user={user} socket={socket} />
      </ProtectedRoute>
    )
  },
  {
    path: "/group/:groupId/rooms",
    element: (
      <ProtectedRoute user={user}>
        <RoomList user={user} socket={socket} />
      </ProtectedRoute>
    )
  },
  {
    path: "/group/:groupId/room/create",
    element: (
      <ProtectedRoute user={user}>
        <CreateRoom user={user} socket={socket} />
      </ProtectedRoute>
    )
  },
  {
    path: "/room/:roomId",
    element: (
      <ProtectedRoute user={user}>
        <ChatRoom user={user} socket={socket} />
      </ProtectedRoute>
    )
  },
  {
    path: "/admin/dashboard",
    element: (
      <AdminRoute user={user}>
        <AdminDashboard user={user} socket={socket} />
      </AdminRoute>
    )
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];