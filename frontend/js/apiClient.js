// Simple API client for api.yaml endpoints (configurable base)
const API = (() => {
  let apiBase = localStorage.getItem('apiBase') || 'http://localhost:5000';
  let userToken = localStorage.getItem('userToken') || '';

  function setApiBase(url) {
    apiBase = url.replace(/\/$/, '');
    localStorage.setItem('apiBase', apiBase);
  }

  function setUserToken(token) {
    userToken = token || '';
    localStorage.setItem('userToken', userToken);
  }

  function headers(additional = {}) {
    const h = { 'Content-Type': 'application/json', ...additional };
    if (userToken) h['user-token'] = userToken;
    return h;
  }

  async function post(path, body) {
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return { status: res.status, body: JSON.parse(text) }; } catch(e) { return { status: res.status, body: text }; }
  }

  async function get(path) {
    const res = await fetch(`${apiBase}${path}`, { headers: headers() });
    const text = await res.text();
    try { return { status: res.status, body: JSON.parse(text) }; } catch(e) { return { status: res.status, body: text }; }
  }

  async function put(path, body) {
    const res = await fetch(`${apiBase}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return { status: res.status, body: JSON.parse(text) }; } catch(e) { return { status: res.status, body: text }; }
  }

  async function del(path) {
    const res = await fetch(`${apiBase}${path}`, { method: 'DELETE', headers: headers() });
    const text = await res.text();
    try { return { status: res.status, body: JSON.parse(text) }; } catch(e) { return { status: res.status, body: text }; }
  }

  // Exposed methods matching api.yaml paths
  return {
    setApiBase,
    setUserToken,
    register: (payload) => post('/users/register', payload),
    login: (payload) => post('/users/login', payload),
    logout: () => get('/users/logout'),
    processCommand: (payload) => post('/data/Comando', payload),
    createCita: (payload) => post('/data/Cita', payload),
    listCitas: (where) => get(`/data/Cita${where ? '?where=' + encodeURIComponent(where) : ''}`),
    getCitaById: (id) => get(`/data/Cita/${encodeURIComponent(id)}`),
    updateCita: (id, payload) => put(`/data/Cita/${encodeURIComponent(id)}`, payload),
    deleteCita: (id) => del(`/data/Cita/${encodeURIComponent(id)}`),
    // Also expose generic helpers
    rawGet: get,
    rawPost: post,
  };
})();

window.API = API;
