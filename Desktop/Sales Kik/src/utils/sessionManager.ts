// Session Management Utility - Handles 2-hour sessions with activity tracking

class SessionManager {
  private static instance: SessionManager;
  private activityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout
  private readonly ACTIVITY_THROTTLE = 30 * 1000; // Update activity max once per 30 seconds

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Initialize session tracking
  init() {
    this.updateActivity();
    this.startActivityTracking();
    this.resetTimers();
  }

  // Update last activity timestamp
  updateActivity() {
    const now = Date.now();
    const lastUpdate = localStorage.getItem('lastActivityUpdate');
    
    // Throttle updates to avoid excessive localStorage writes
    if (!lastUpdate || (now - parseInt(lastUpdate)) > this.ACTIVITY_THROTTLE) {
      localStorage.setItem('lastActivity', now.toString());
      localStorage.setItem('lastActivityUpdate', now.toString());
      this.resetTimers();
    }
  }

  // Start tracking user activity
  private startActivityTracking() {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress', 
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Throttled activity update
    let throttleTimer: NodeJS.Timeout;
    const throttledUpdate = () => {
      clearTimeout(throttleTimer);
      throttleTimer = setTimeout(() => this.updateActivity(), 1000);
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });
  }

  // Reset inactivity timers
  private resetTimers() {
    // Clear existing timers
    if (this.activityTimer) clearTimeout(this.activityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    // Set warning timer (5 minutes before logout)
    this.warningTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.SESSION_DURATION - this.WARNING_TIME);

    // Set logout timer (2 hours)
    this.activityTimer = setTimeout(() => {
      this.handleInactivityLogout();
    }, this.SESSION_DURATION);
  }

  // Show warning before auto-logout
  private showInactivityWarning() {
    const shouldStayLoggedIn = confirm(
      'You will be logged out in 5 minutes due to inactivity. Click OK to stay logged in.'
    );

    if (shouldStayLoggedIn) {
      this.updateActivity(); // This will reset timers
    }
  }

  // Handle automatic logout due to inactivity
  private handleInactivityLogout() {
    console.log('Session expired due to inactivity');
    
    // Clear session data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('lastActivityUpdate');
    
    // Show notification and redirect
    alert('Your session has expired due to inactivity. Please log in again.');
    window.location.href = '/login';
  }

  // Manual logout (button click)
  logout() {
    // Clear timers
    if (this.activityTimer) clearTimeout(this.activityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    
    // Clear session data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('lastActivityUpdate');
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Check if session is still valid
  isSessionValid(): boolean {
    const token = localStorage.getItem('accessToken');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!token || !lastActivity) {
      return false;
    }

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity < this.SESSION_DURATION;
  }

  // Get remaining session time
  getRemainingTime(): number {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return 0;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    const remaining = this.SESSION_DURATION - timeSinceActivity;
    return Math.max(0, remaining);
  }
}

export default SessionManager;