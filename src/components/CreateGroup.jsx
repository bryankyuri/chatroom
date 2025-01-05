import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';

const GroupCreate = ({ user, socket }) => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [maxUsers, setMaxUsers] = useState(50);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    socket.emit('group:create', {
      name: groupName.trim(),
      maxUsers: parseInt(maxUsers),
      creator: user
    });

    socket.on('group:created', ({ groupId }) => {
      navigate(`/group/${groupId}`);
    });

    socket.on('group:error', (errorMessage) => {
      setError(errorMessage);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Create New Group
        </h2>
        
        {error && (
          <div className="mb-4 p-2 text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Users
            </label>
            <input
              type="number"
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              min="2"
              max="100"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Group
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupCreate
