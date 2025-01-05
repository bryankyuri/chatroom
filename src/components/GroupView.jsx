// src/components/GroupView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Settings,
  Plus,
  Trash2,
  MessageCircle,
  Lock,
  X,
  Info,
  ChevronRight,
} from "lucide-react";

const GroupView = ({ user, socket }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dataReceived, setDataReceived] = useState(false);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchData = async () => {
      if (!socket?.connected || !user) {
        setError("Connection not established. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching group data:", groupId);
        setIsLoading(true);
        setError("");
        socket.emit("group:fetch", { groupId, userId: user.id });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch group data");
        setIsLoading(false);
      }
    };

    // Handle response events
    const handleGroupUpdate = (groupData) => {
      if (!mounted) return;
      console.log("Received group data:", groupData);
      if (groupData && groupData.id === groupId) {
        setGroup(groupData);
        setDataReceived(true);
      }
    };

    const handleRoomsUpdate = (data) => {
      if (!mounted) return;
      console.log("Received rooms update:", data);
      if (data && data.groupId === groupId) {
        setRooms(data.rooms || []);
        setIsLoading(false); // Only set loading false after receiving rooms
      }
    };

    const handleError = (errorMessage) => {
      if (!mounted) return;
      console.error("Socket error:", errorMessage);

      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying... Attempt ${retryCount}`);
        setTimeout(fetchData, 1000); // Retry after 1 second
      } else {
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    // Set up socket listeners
    socket.on("group:info", handleGroupUpdate);
    socket.on("rooms:update", handleRoomsUpdate);
    socket.on("error", handleError);

    // Initial fetch
    fetchData();

    // Cleanup function
    return () => {
      mounted = false;
      socket.off("group:info", handleGroupUpdate);
      socket.off("rooms:update", handleRoomsUpdate);
      socket.off("error", handleError);
    };
  }, [socket, groupId, user]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    socket.emit("room:create", {
      groupId,
      name: formData.get("roomName"),
      description: formData.get("description"),
      isPublic: true, // Set default to public
      permissions: {
        // In public rooms, everyone can post messages and share media by default
        canPostMessages: group.members, // All group members can post
        canShareMedia: group.members, // All group members can share media
        canInviteOthers: [user.id], // Only creator can invite others
      },
      creator: user,
    });

    setShowCreateRoom(false);
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading group information...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-100 text-red-600 p-4 rounded-lg max-w-md text-center">
          <p className="font-medium">{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/groups")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No Group Found State
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg max-w-md text-center">
          <p className="font-medium">
            Group not found or you don't have access.
          </p>
          <button
            onClick={() => navigate("/groups")}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = group.adminId === user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Group Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <div className="flex items-center mt-2 text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{group.members.length} members</span>
            </div>
          </div>
          <button
            onClick={() => setShowMembers(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            View Members
          </button>
        </div>
      </div>

      {/* Rooms Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Chat Rooms</h2>
          {isAdmin && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="h-5 w-5" />
              Create Room
            </button>
          )}
        </div>

        {/* Empty State for Rooms */}
        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Chat Rooms Yet
            </h3>
            <p className="text-gray-500 mb-6">
              {isAdmin
                ? "Create your first chat room to get started!"
                : "No chat rooms have been created in this group yet."}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowCreateRoom(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Room
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{room.name}</h3>
                      {room.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {room.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Public Room
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {room.members?.length || 0} members
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Join Chat
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Room</h3>
              <button onClick={() => setShowCreateRoom(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    name="roomName"
                    type="text"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="3"
                    placeholder="Enter room description"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Group Members</h3>
              <button onClick={() => setShowMembers(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {group?.members.map((memberId) => (
                <div
                  key={memberId}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-800 font-semibold">
                        {memberId.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-3">{memberId}</span>
                    {memberId === group.adminId && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  {isAdmin && memberId !== user.id && (
                    <button
                      onClick={() => {
                        socket.emit("group:remove-member", {
                          groupId,
                          userId: memberId,
                        });
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupView;
