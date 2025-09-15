declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export class TelegramWebApp {
  static get instance() {
    return window.Telegram?.WebApp;
  }

  static get user(): TelegramUser | null {
    return this.instance?.initDataUnsafe?.user || null;
  }

  static get isAvailable(): boolean {
    return !!window.Telegram?.WebApp;
  }

  static init() {
    if (this.isAvailable) {
      this.instance?.ready();
      this.instance?.expand();
    }
  }

  static showMainButton(text: string, onClick: () => void) {
    if (!this.isAvailable) return;
    
    const mainButton = this.instance!.MainButton;
    mainButton.text = text;
    mainButton.show();
    mainButton.onClick(onClick);
  }

  static hideMainButton() {
    if (!this.isAvailable) return;
    this.instance!.MainButton.hide();
  }

  static showBackButton(onClick: () => void) {
    if (!this.isAvailable) return;
    
    const backButton = this.instance!.BackButton;
    backButton.show();
    backButton.onClick(onClick);
  }

  static hideBackButton() {
    if (!this.isAvailable) return;
    this.instance!.BackButton.hide();
  }

  static hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string) {
    if (!this.isAvailable) return;
    
    const haptic = this.instance!.HapticFeedback;
    
    switch (type) {
      case 'impact':
        haptic.impactOccurred((style as any) || 'medium');
        break;
      case 'notification':
        haptic.notificationOccurred((style as any) || 'success');
        break;
      case 'selection':
        haptic.selectionChanged();
        break;
    }
  }

  static getTelegramId(): string {
    return this.user?.id?.toString() || "123456789";
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  TelegramWebApp.init();
}
