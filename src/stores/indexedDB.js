// indexedDB helper for storing pending user registrations
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('pokedex_offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_registrations')) {
        db.createObjectStore('pending_registrations', { keyPath: 'email' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingRegistration(registration) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_registrations', 'readwrite');
    tx.objectStore('pending_registrations').put(registration);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

export async function getAllPendingRegistrations() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_registrations', 'readonly');
    const store = tx.objectStore('pending_registrations');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

export async function removePendingRegistration(email) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_registrations', 'readwrite');
    tx.objectStore('pending_registrations').delete(email);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}
