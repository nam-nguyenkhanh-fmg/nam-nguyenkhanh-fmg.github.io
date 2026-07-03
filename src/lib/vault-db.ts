const DB_NAME = 'fmg-token-vault';
const DB_VERSION = 1;
const VAULT_STORE = 'vault';
const WEBAUTHN_STORE = 'webauthn';

export interface EncryptedBlob {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

export interface VaultRecord {
  data: EncryptedBlob;
}

export interface WebAuthnRecord {
  credentialId: ArrayBuffer;
  prfSalt: Uint8Array;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VAULT_STORE))
        db.createObjectStore(VAULT_STORE);
      if (!db.objectStoreNames.contains(WEBAUTHN_STORE))
        db.createObjectStore(WEBAUTHN_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function put<T>(
  storeName: string,
  key: string,
  value: T,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function remove(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getVault(): Promise<VaultRecord | undefined> {
  return get<VaultRecord>(VAULT_STORE, 'data');
}

export async function saveVault(record: VaultRecord): Promise<void> {
  return put(VAULT_STORE, 'data', record);
}

export async function deleteVault(): Promise<void> {
  await remove(VAULT_STORE, 'data');
  await remove(WEBAUTHN_STORE, 'credential');
}

export async function getWebAuthn(): Promise<WebAuthnRecord | undefined> {
  return get<WebAuthnRecord>(WEBAUTHN_STORE, 'credential');
}

export async function saveWebAuthn(record: WebAuthnRecord): Promise<void> {
  return put(WEBAUTHN_STORE, 'credential', record);
}

export async function deleteWebAuthn(): Promise<void> {
  return remove(WEBAUTHN_STORE, 'credential');
}
