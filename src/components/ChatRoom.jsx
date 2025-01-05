import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Image as ImageIcon,
  Send,
  ArrowLeft,
  Users,
  X,
  Lock,
} from "lucide-react";

const ChatRoom = ({ user, socket }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingStream, setRecordingStream] = useState(null);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef({});

  useEffect(() => {
    if (!socket?.connected || !user) {
      setError("Connection not established");
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    socket.emit("room:join", { roomId, user });

    const handleRoomInfo = (info) => {
      console.log("Room info received:", info);
      setRoomInfo(info);
    };

    const handleGroupInfo = (info) => {
      setGroupInfo(info);
    };

    const handleMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleTyping = ({ userId, username }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, { username, timestamp: Date.now() });
        return next;
      });
    };

    const handleStopTyping = ({ userId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("room:info", handleRoomInfo);
    socket.on("group:info", handleGroupInfo);
    socket.on("message:received", handleMessage);
    socket.on("message:history", setMessages);
    socket.on("user:typing", handleTyping);
    socket.on("user:stop-typing", handleStopTyping);

    // Clean up typing users periodically
    const typingCleanup = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next = new Map(prev);
        for (const [userId, data] of next.entries()) {
          if (now - data.timestamp > 3000) {
            next.delete(userId);
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop());
      }
      socket.emit("room:leave", { roomId, user });
      socket.off("room:info", handleRoomInfo);
      socket.off("group:info", handleGroupInfo);
      socket.off("message:received", handleMessage);
      socket.off("message:history");
      socket.off("user:typing", handleTyping);
      socket.off("user:stop-typing", handleStopTyping);
      clearInterval(typingCleanup);
    };
  }, [socket, roomId, user]);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current[user.id]) {
      clearTimeout(typingTimeoutRef.current[user.id]);
    }

    socket.emit("user:typing", {
      roomId,
      userId: user.id,
      username: user.username,
    });

    typingTimeoutRef.current[user.id] = setTimeout(() => {
      socket.emit("user:stop-typing", { roomId, userId: user.id });
    }, 1000);
  };

  const sendMessage = (type, content) => {
    if (!isConnected) {
      setError("Cannot send message: Not connected to server");
      return;
    }

    if (!canPerformAction("postMessage")) {
      setError("You don't have permission to send messages");
      return;
    }

    // For media types, check media sharing permission
    if (
      (type === "audio" || type === "image") &&
      !canPerformAction("shareMedia")
    ) {
      setError("You don't have permission to share media");
      return;
    }

    socket.emit("message:send", {
      roomId,
      message: {
        type,
        content,
        sender: user,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage("text", message);
      setMessage("");
    }
  };

  const startRecording = async () => {
    if (!roomInfo?.isPublic && !roomInfo?.permissions?.canShareMedia) {
      setError("You don't have permission to share audio");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);

      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        if (audioBlob.size > 5000000) {
          setError("Audio file too large. Please record a shorter message.");
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          sendMessage("audio", reader.result);
        };

        stream.getTracks().forEach((track) => track.stop());
        setRecordingStream(null);
      };

      recorder.onerror = (err) => {
        setError("Recording error: " + err.name);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingStream(null);
        setIsRecording(false);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Error accessing microphone: " + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e) => {
    if (!roomInfo?.isPublic && !roomInfo?.permissions?.canShareMedia) {
      setError("You don't have permission to share images");
      return;
    }

    try {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      if (file.size > 5000000) {
        setError("Image too large. Please select an image under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        sendMessage("image", reader.result);
      };

      e.target.value = "";
    } catch (err) {
      setError("Error uploading image: " + err.message);
    }
  };

  const getTypingText = () => {
    const typingUsernames = Array.from(typingUsers.values())
      .map((data) => data.username)
      .filter((username) => username !== user.username);

    if (typingUsernames.length === 0) return "";
    if (typingUsernames.length === 1)
      return `${typingUsernames[0]} is typing...`;
    if (typingUsernames.length === 2)
      return `${typingUsernames.join(" and ")} are typing...`;
    return `${typingUsernames.length} people are typing...`;
  };

  const canPerformAction = (actionType) => {
    // If room is public, all actions are allowed
    if (roomInfo?.isPublic) return true;

    // For private rooms, check specific permissions
    switch (actionType) {
      case "postMessage":
        return roomInfo?.members?.includes(user.id);
      case "shareMedia":
        return roomInfo?.members?.includes(user.id);
      default:
        return false;
    }
  };
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat Room Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-semibold text-lg">
                {roomInfo?.name || "Chat Room"}
              </h1>
              {roomInfo && (
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  <span>
                    {roomInfo.memberCount || 0} members ·{" "}
                    {roomInfo.activeMembers || 0} online
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="fixed top-14 left-0 right-0 bg-red-100 border-b border-red-200 py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError("")} className="text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pt-14 pb-16">
        <div className="p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${
                msg.sender?.id === user.id ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg max-w-[80%] ${
                  msg.sender?.id === user.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {msg.sender?.username}
                </div>
                {msg.type === "text" && (
                  <p className="break-words">{msg.content}</p>
                )}
                {msg.type === "audio" && (
                  <audio controls src={msg.content} className="max-w-xs" />
                )}
                {msg.type === "image" && (
                  <img
                    src={msg.content}
                    alt="Shared image"
                    className="max-w-xs rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "placeholder-image-url";
                    }}
                  />
                )}
                <div className="text-xs opacity-75 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="fixed bottom-20 left-4">
          <div className="bg-white rounded-full px-4 py-2 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">{getTypingText()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center space-x-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder={
                canPerformAction("postMessage")
                  ? "Type a message..."
                  : "You cannot send messages in this room"
              }
              className="w-full p-2 pr-24 border rounded-full focus:outline-none focus:border-blue-500"
              disabled={!isConnected || !canPerformAction("postMessage")}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {canPerformAction("shareMedia") && (
                <>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                      isRecording ? "text-red-500" : "text-gray-500"
                    }`}
                    disabled={!isConnected}
                    title={isRecording ? "Stop Recording" : "Record Audio"}
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                    disabled={!isConnected}
                    title="Upload Image"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              <button
                type="submit"
                className={`p-2 rounded-full transition-colors ${
                  message.trim() && canPerformAction("postMessage")
                    ? "text-blue-500 hover:bg-blue-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={
                  !isConnected ||
                  !message.trim() ||
                  !canPerformAction("postMessage")
                }
                title="Send Message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
