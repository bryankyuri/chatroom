// src/components/GroupList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, MessageCircle, UserPlus, X, Home, Globe } from 'lucide-react';

const GroupList = ({ user, socket }) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' or 'available'

  useEffect(() => {
    if (!socket?.connected || !user) {
      setError('Connection not established');
      setIsLoading(false);
      return;
    }

    const handleGroupsUpdate = (updatedGroups) => {
      console.log('Received groups update:', updatedGroups);
      setGroups(updatedGroups);
      setIsLoading(false);
    };

    const handleError = (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
    };

    socket.on('groups:update', handleGroupsUpdate);
    socket.on('group:error', handleError);
    socket.on('group:joined', ({ groupId }) => {
      navigate(`/group/${groupId}`);
    });

    // Request initial groups data
    socket.emit('groups:fetch');

    return () => {
      socket.off('groups:update', handleGroupsUpdate);
      socket.off('group:error', handleError);
      socket.off('group:joined');
    };
  }, [socket, user, navigate]);

  const handleJoinRequest = (groupId) => {
    if (!socket?.connected) {
      setError('Connection not established');
      return;
    }
    socket.emit('group:join-request', { groupId, user });
  };

  // Filter groups based on active tab
  const filteredGroups = groups.filter(group => {
    if (activeTab === 'joined') {
      return group.members.includes(user.id);
    } else {
      return !group.members.includes(user.id);
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Groups
        </h1>
        <Link
          to="/group/create"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Group
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError('')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 mb-6">
        <button
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${
            activeTab === 'joined'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('joined')}
        >
          <Home className="h-4 w-4" />
          My Groups
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${
            activeTab === 'available'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('available')}
        >
          <Globe className="h-4 w-4" />
          Available Groups
        </button>
      </div>

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'joined' 
              ? 'No Groups Joined Yet' 
              : 'No Available Groups'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'joined' 
              ? 'Join some groups to get started!' 
              : 'All available groups have been joined.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{group.members.length} / {group.maxUsers} members</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Public Group
                        </span>
                        {group.adminId === user.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeTab === 'joined' ? (
                    <Link
                      to={`/group/${group.id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoinRequest(group.id)}
                      disabled={group.members.length >= group.maxUsers}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        group.members.length >= group.maxUsers
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      {group.members.length >= group.maxUsers ? 'Full' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupList;