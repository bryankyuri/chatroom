// src/utils/sessionManager.js
export const saveSession = (userData) => {
  localStorage.setItem('chatSession', JSON.stringify({
    user: userData,
    timestamp: new Date().toISOString()
  }));
};

export const getSession = () => {
  const session = localStorage.getItem('chatSession');
  if (!session) return null;
  
  try {
    const parsedSession = JSON.parse(session);
    // Optional: Check if session is expired (e.g., 24 hours)
    const sessionAge = new Date() - new Date(parsedSession.timestamp);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('chatSession');
      return null;
    }
    
    return parsedSession.user;
  } catch (error) {
    localStorage.removeItem('chatSession');
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem('chatSession');
};