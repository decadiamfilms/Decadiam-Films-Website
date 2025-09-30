import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ActivityTrackerOptions {
  inactivityTimeout?: number; // in milliseconds
  warningTime?: number; // show warning before logout
  checkInterval?: number; // how often to check
}

export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const navigate = useNavigate();
  
  const {
    inactivityTimeout = 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    warningTime = 5 * 60 * 1000, // 5 minutes warning
    checkInterval = 60 * 1000 // check every minute
  } = options;

  const updateLastActivity = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivity');
    navigate('/login');
  }, [navigate]);

  const checkActivity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    const token = localStorage.getItem('accessToken');
    
    if (!token || !lastActivity) {
      return; // Not logged in
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    const timeUntilLogout = inactivityTimeout - timeSinceLastActivity;

    // Show warning if close to logout
    if (timeUntilLogout <= warningTime && timeUntilLogout > 0) {
      const minutesLeft = Math.ceil(timeUntilLogout / (60 * 1000));
      
      // Only show warning once per session
      const warningShown = sessionStorage.getItem('inactivityWarningShown');
      if (!warningShown) {
        const shouldStayLoggedIn = confirm(
          `You will be logged out in ${minutesLeft} minutes due to inactivity. Click OK to stay logged in.`
        );
        
        if (shouldStayLoggedIn) {
          updateLastActivity();
          sessionStorage.setItem('inactivityWarningShown', 'true');
          // Clear warning flag after successful activity update
          setTimeout(() => {
            sessionStorage.removeItem('inactivityWarningShown');
          }, warningTime);
        }
      }
    }

    // Auto logout if timeout exceeded
    if (timeSinceLastActivity >= inactivityTimeout) {
      console.log('Auto-logout due to inactivity');
      handleLogout();
    }
  }, [inactivityTimeout, warningTime, updateLastActivity, handleLogout]);

  // Track user activity
  useEffect(() => {
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle activity updates to avoid too many localStorage writes
    let activityUpdateThrottle: NodeJS.Timeout;
    
    const throttledUpdateActivity = () => {
      clearTimeout(activityUpdateThrottle);
      activityUpdateThrottle = setTimeout(updateLastActivity, 1000); // Update at most once per second
    };

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    // Set initial activity time
    updateLastActivity();

    // Start activity checking interval
    const activityChecker = setInterval(checkActivity, checkInterval);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
      clearInterval(activityChecker);
      clearTimeout(activityUpdateThrottle);
    };
  }, [updateLastActivity, checkActivity, checkInterval]);

  // Also track route changes as activity
  useEffect(() => {
    updateLastActivity();
  }, [navigate, updateLastActivity]);

  return {
    updateLastActivity,
    handleLogout
  };
}