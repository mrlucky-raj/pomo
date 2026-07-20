/**
 * Vision Board Local Storage Service using Browser IndexedDB
 * Stores Vision Board items (images, videos, sticky notes, quotes) locally on device
 */

const DB_NAME = 'pomo_vision_db';
const DB_VERSION = 1;
const STORE_NAME = 'vision_items';

class VisionStorageService {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported by browser. Falling back to local storage.');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('pinned', 'pinned', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async getItems() {
    await this.initPromise;
    if (!this.db) {
      // Fallback to localStorage if IndexedDB fails
      const raw = localStorage.getItem('pomo_vision_items_fallback');
      return raw ? JSON.parse(raw) : [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort newest or pinned first
        items.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveItem(item) {
    await this.initPromise;
    const newItem = {
      id: item.id || `vision_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: item.type || 'note',
      title: item.title || '',
      content: item.content || '',
      author: item.author || '',
      color: item.color || 'emerald',
      pinned: item.pinned ?? true,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    if (!this.db) {
      const current = await this.getItems();
      const idx = current.findIndex(i => i.id === newItem.id);
      let updated;
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = newItem;
      } else {
        updated = [newItem, ...current];
      }
      localStorage.setItem('pomo_vision_items_fallback', JSON.stringify(updated));
      return newItem;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(newItem);

      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(id) {
    await this.initPromise;
    if (!this.db) {
      const current = await this.getItems();
      const updated = current.filter(i => i.id !== id);
      localStorage.setItem('pomo_vision_items_fallback', JSON.stringify(updated));
      return id;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async togglePin(id) {
    const items = await this.getItems();
    const target = items.find(i => i.id === id);
    if (target) {
      target.pinned = !target.pinned;
      await this.saveItem(target);
    }
  }
}

export const visionStorage = new VisionStorageService();
