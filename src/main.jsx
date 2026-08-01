import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Sets up window.storage BEFORE rendering App, so App.jsx itself needs zero changes
// to run either inside a Claude.ai artifact (which provides a real window.storage)
// or here, standalone, deployed via GitHub Pages (where it's backed by localStorage
// instead). Same async get/set/delete/list shape either way.
function storageKey(key, shared) {
  return (shared ? 'nsheera:shared:' : 'nsheera:personal:') + key;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(storageKey(key, shared));
    if (raw === null) throw new Error('Key not found: ' + key);
    return { key, value: raw, shared };
  },
  async set(key, value, shared = false) {
    localStorage.setItem(storageKey(key, shared), value);
    return { key, value, shared };
  },
  async delete(key, shared = false) {
    localStorage.removeItem(storageKey(key, shared));
    return { key, deleted: true, shared };
  },
  async list(prefix = '', shared = false) {
    const fullPrefix = storageKey(prefix, shared);
    const stripLen = (shared ? 'nsheera:shared:' : 'nsheera:personal:').length;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) keys.push(k.slice(stripLen));
    }
    return { keys, prefix, shared };
  },
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
