class TelegramService {
  constructor() {
    this.webApp = null;
  }

  init() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
      this.setTheme();
    }
  }

  setTheme() {
    if (this.webApp) {
      this.webApp.setHeaderColor('#0a0a1a');
      this.webApp.setBackgroundColor('#0a0a1a');
    }
  }

  showAlert(message) {
    if (this.webApp) {
      this.webApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  hapticFeedback() {
    if (this.webApp?.HapticFeedback) {
      this.webApp.HapticFeedback.impactOccurred('light');
    }
  }

  getUserId() {
    return this.webApp?.initDataUnsafe?.user?.id || null;
  }

  getUsername() {
    return this.webApp?.initDataUnsafe?.user?.username || 'Unknown';
  }

  getFirstName() {
    return this.webApp?.initDataUnsafe?.user?.first_name || 'Traveler';
  }
}

export default new TelegramService();
