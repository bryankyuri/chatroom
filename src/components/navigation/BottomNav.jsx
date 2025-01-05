import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Shield, LogOut } from 'lucide-react';

const BottomNav = ({ user, onLogout }) => {
  const location = useLocation();
  const isChatRoom = location.pathname.includes('/room/');

  if (!user || isChatRoom) return null;

  const isActive = (path) => location.pathname === path;

  const navigationItems = [
    {
      name: 'Home',
      path: '/groups',
      icon: Home,
      show: true
    },
    {
      name: 'My Groups',
      path: '/groups',
      icon: MessageSquare,
      show: true
    },
    {
      name: 'Admin',
      path: '/admin/dashboard',
      icon: Shield,
      show: user.isAdmin
    }
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white border-t shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navigationItems
            .filter(item => item.show)
            .map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center px-3 py-2 text-xs ${
                    active 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          <button
            onClick={onLogout}
            className="flex flex-col items-center px-3 py-2 text-xs text-red-600"
          >
            <LogOut className="h-6 w-6 mb-1" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;