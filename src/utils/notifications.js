export const requestNotificationPermission = async () => {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission); // Debug log
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const showNotification = (title, body) => {
  // Check if notification is supported and permission is granted
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    // Create and show notification
    new Notification(title, {
      body: body,
      icon: '/vite.svg', // Add your app icon
      tag: 'chat-message'
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};