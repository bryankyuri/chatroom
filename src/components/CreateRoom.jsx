// src/components/CreateRoom.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateRoom = ({ user, socket }) => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for room creation response
    const handleRoomCreated = () => {
      navigate('/rooms');
    };

    const handleRoomError = (error) => {
      setError(error || 'Failed to create room');
    };

    socket.on('room:created', handleRoomCreated);
    socket.on('room:error', handleRoomError);

    return () => {
      socket.off('room:created', handleRoomCreated);
      socket.off('room:error', handleRoomError);
    };
  }, [socket, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    // Emit room creation event
    socket.emit('room:create', {
      name: roomName.trim(),
      isPrivate,
      creator: user
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Create Chat Room</h2>
        
        {error && (
          <div className="mb-4 p-2 text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="roomName">
            Room Name
          </label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <label className="flex items-center mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mr-2"
          />
          <span className="text-gray-700">Private Room</span>
        </label>

        <button 
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none"
        >
          Create Room
        </button>
      </form>
    </div>
  );
};

export default CreateRoom;