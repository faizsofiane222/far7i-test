import CryptoJS from 'crypto-js';

// Clé de chiffrement (devrait être dans les variables d'environnement)
const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'far7i-default-key-change-in-production';

/**
 * Secure storage wrapper that encrypts data before storing in localStorage
 */
export const secureStorage = {
  getItem: (key: string): string | null => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return decrypted || null;
    } catch (error) {
      console.error('Error decrypting storage item:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error encrypting storage item:', error);
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  }
};
