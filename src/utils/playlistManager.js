// Lógica de gestión de listas de reproducción
export default {
  // Métodos: addTrack, removeTrack, getTracks, etc.
};

// Utilidades para persistir y restaurar el FileSystemDirectoryHandle en IndexedDB
const DB_NAME = 'pwa-musicplayer-db';
const STORE_NAME = 'handles';
const DIR_KEY = 'lastDirectory';

export async function saveDirectoryHandle(handle) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(STORE_NAME);
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, DIR_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  });
}

export async function getDirectoryHandle() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(STORE_NAME);
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(DIR_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
    open.onerror = () => reject(open.error);
  });
}

export async function clearDirectoryHandle() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(STORE_NAME);
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(DIR_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  });
}
