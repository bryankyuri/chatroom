// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Settings, Plus, Trash2, MessageCircle, 
  UserPlus, Lock, Globe, ChevronDown, Shield, 
  Edit, X, BarChart 
} from 'lucide-react';

const AdminDashboard = ({ user, socket }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeRooms: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('groups:update', (updatedGroups) => {
      const adminGroups = updatedGroups.filter(group => group.adminId === user.id);
      setGroups(adminGroups);
    });

    socket.on('group:join-request', (request) => {
      setJoinRequests(prev => [...prev, request]);
    });

    socket.on('stats:update', (updatedStats) => {
      setStats(updatedStats);
    });

    // Request initial data
    socket.emit('admin:request-data', { userId: user.id });

    return () => {
      socket.off('groups:update');
      socket.off('group:join-request');
      socket.off('stats:update');
    };
  }, [socket, user.id]);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    socket.emit('group:create', {
      name: formData.get('groupName').trim(),
      maxUsers: parseInt(formData.get('maxUsers')),
      creator: user
    });

    setShowCreateGroup(false);
  };

  const handleRemoveMember = (groupId, memberId) => {
    socket.emit('group:remove-member', { groupId, userId: memberId });
  };

  const handleJoinRequest = (groupId, userId, accepted) => {
    socket.emit('group:join-response', { groupId, userId, accepted });
    setJoinRequests(prev => prev.filter(req => 
      req.groupId !== groupId || req.user.id !== userId
    ));
  };

  const handleUpdatePermissions = (groupId, roomId, permissions) => {
    socket.emit('room:update-permissions', { groupId, roomId, permissions });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500" />
              Admin Dashboard
            </h1>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="h-5 w-5" />
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500">Total Users</h3>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500">Active Rooms</h3>
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{stats.activeRooms}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500">Total Messages</h3>
              <BarChart className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalMessages}</p>
          </div>
        </div>

        {/* Join Requests */}
        {joinRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Pending Join Requests</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {joinRequests.map((request) => (
                <div
                  key={`${request.groupId}-${request.user.id}`}
                  className="p-4 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{request.user.username}</p>
                    <p className="text-sm text-gray-500">
                      wants to join {groups.find(g => g.id === request.groupId)?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoinRequest(request.groupId, request.user.id, true)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleJoinRequest(request.groupId, request.user.id, false)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Your Groups</h2>
          </div>
          {groups.map((group) => (
            <div key={group.id} className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    {group.members.length} / {group.maxUsers} members
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedGroup(group)}
                    className="px-3 py-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    Manage
                  </button>
                  <Link
                    to={`/group/${group.id}`}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Group</h3>
              <button onClick={() => setShowCreateGroup(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    name="groupName"
                    type="text"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Users
                  </label>
                  <input
                    name="maxUsers"
                    type="number"
                    min="2"
                    max="100"
                    defaultValue="50"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[42rem] max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Manage {selectedGroup.name}</h3>
              <button onClick={() => setSelectedGroup(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Group Settings */}
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Group Settings</h4>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span>Maximum Users</span>
                    <input
                      type="number"
                      value={selectedGroup.maxUsers}
                      onChange={(e) => {
                        socket.emit('group:update', {
                          groupId: selectedGroup.id,
                          maxUsers: parseInt(e.target.value)
                        });
                      }}
                      min="2"
                      max="100"
                      className="w-24 p-1 border rounded text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Member Management */}
              <div>
                <h4 className="font-medium mb-2">Members</h4>
                <div className="border rounded-lg divide-y">
                  {selectedGroup.members.map((memberId) => (
                    <div
                      key={memberId}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-semibold">
                            {memberId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{memberId === user.id ? 'You' : memberId}</span>
                      </div>
                      {memberId !== user.id && (
                        <button
                          onClick={() => handleRemoveMember(selectedGroup.id, memberId)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Management */}
              <div>
                <h4 className="font-medium mb-2">Rooms</h4>
                <div className="border rounded-lg divide-y">
                  {selectedGroup.rooms?.map((roomId) => {
                    const room = rooms.find(r => r.id === roomId);
                    return room ? (
                      <div key={room.id} className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">{room.name}</h5>
                          <button
                            onClick={() => {
                              // Handle room settings
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">{room.description}</div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;