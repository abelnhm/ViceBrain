const storage = {
  get(key, defaultVal) {
    try { return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : defaultVal; }
    catch(e) { return defaultVal; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch(e) { console.error('Storage error:', e); }
  }
};