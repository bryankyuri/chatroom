// src/components/navigation/Header.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Header = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatRoom = location.pathname.includes("/room/");

  if (!user || location.pathname.includes('/room/')) return null;

  return (
    <div className="fixed top-0 w-full z-50">
      <div className="bg-blue-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {isChatRoom || (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{user.username}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
