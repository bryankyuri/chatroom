// src/components/RoomList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Plus, Settings, Users, 
  Lock, Globe, Info, X 
} from 'lucide-react';

const EmptyState = ({ isAdmin, groupId }) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="flex justify-center mb-4">
        <MessageSquare className="h-16 w-16 text-gray-300" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Chat Rooms Yet
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        {isAdmin 
          ? "Create your first chat room to get started!"
          : "No chat rooms have been created in this group yet."}
      </p>
      {isAdmin && (
        <Link
          to={`/group/${groupId}/room/create`}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create First Room
        </Link>
      )}
    </div>
  );
};

const RoomList = ({ user, socket }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for room updates
    socket.emit('group:fetch', { groupId });

    socket.on('group:info', (groupInfo) => {
      setGroup(groupInfo);
    });

    socket.on('rooms:update', ({ groupId: updatedGroupId, rooms: updatedRooms }) => {
      if (updatedGroupId === groupId) {
        setRooms(updatedRooms);
        setIsLoading(false);
      }
    });

    socket.on('room:error', (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
    });

    // Cleanup
    return () => {
      socket.off('group:info');
      socket.off('rooms:update');
      socket.off('room:error');
    };
  }, [socket, groupId]);

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const handleUpdatePermissions = (roomId, permissions) => {
    if (group?.adminId === user.id) {
      socket.emit('room:update-permissions', {
        roomId,
        permissions
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                {group?.name} - Chat Rooms
              </h1>
              <span className="ml-4 text-sm text-gray-500">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
              </span>
            </div>
            {group?.adminId === user.id && (
              <Link
                to={`/group/${groupId}/room/create`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Room
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState 
            isAdmin={group?.adminId === user.id}
            groupId={groupId}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{room.name}</h3>
                      {room.description && (
                        <p className="text-sm text-gray-500 mt-1">{room.description}</p>
                      )}
                    </div>
                    {group?.adminId === user.id && (
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {room.members?.length || 0} members
                    </div>
                    {room.permissions?.canPostMessages.includes(user.id) ? (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Join Chat
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg flex items-center gap-2"
                        disabled
                      >
                        <Lock className="h-4 w-4" />
                        No Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Settings Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Room Settings - {selectedRoom.name}</h3>
              <button onClick={() => setSelectedRoom(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Permissions</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedRoom.permissions.canPostMessages.includes(user.id)}
                      onChange={(e) => handleUpdatePermissions(selectedRoom.id, {
                        ...selectedRoom.permissions,
                        canPostMessages: e.target.checked
                          ? [...selectedRoom.permissions.canPostMessages, user.id]
                          : selectedRoom.permissions.canPostMessages.filter(id => id !== user.id)
                      })}
                    />
                    <span>Can Post Messages</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedRoom.permissions.canShareMedia.includes(user.id)}
                      onChange={(e) => handleUpdatePermissions(selectedRoom.id, {
                        ...selectedRoom.permissions,
                        canShareMedia: e.target.checked
                          ? [...selectedRoom.permissions.canShareMedia, user.id]
                          : selectedRoom.permissions.canShareMedia.filter(id => id !== user.id)
                      })}
                    />
                    <span>Can Share Media</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;