import { ctx } from './m_context.js';

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ctx.dbName, 2);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('ebooks')) {
        db.createObjectStore('ebooks', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => { ctx.db = event.target.result; resolve(); };
    request.onerror = (event) => reject(event.target.error);
  });
}

export function saveBookToDB(bookData) {
  return new Promise((resolve, reject) => {
    if (!ctx.db) return reject('DB not initialized');
    const tx = ctx.db.transaction(['ebooks'], 'readwrite');
    const store = tx.objectStore('ebooks');
    const req = store.put(bookData);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

export function getBookFromDB(id) {
  return new Promise((resolve, reject) => {
    if (!ctx.db) return reject('DB not initialized');
    const req = ctx.db.transaction(['ebooks'], 'readonly').objectStore('ebooks').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export function getAllBooksFromDB() {
  return new Promise((resolve, reject) => {
    if (!ctx.db) return reject('DB not initialized');
    const req = ctx.db.transaction(['ebooks'], 'readonly').objectStore('ebooks').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export function deleteBookFromDB(id) {
  return new Promise((resolve, reject) => {
    if (!ctx.db) return reject('DB not initialized');
    const req = ctx.db.transaction(['ebooks'], 'readwrite').objectStore('ebooks').delete(id);
    req.onsuccess = () => { localStorage.removeItem(`location-${id}`); resolve(); };
    req.onerror = (e) => reject(e.target.error);
  });
}

export function clearDB() {
  return new Promise((resolve) => {
    if (!ctx.db) return resolve();
    const req = ctx.db.transaction(['ebooks'], 'readwrite').objectStore('ebooks').clear();
    req.onsuccess = () => resolve();
  });
}
