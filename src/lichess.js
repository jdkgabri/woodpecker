// Login con Lichess mediante OAuth2 + PKCE (no necesita servidor propio).
const HOST = 'https://lichess.org';
const CLIENT_ID = 'woodpecker-trainer';
const SCOPES = ['puzzle:read'];
const KEY = 'wp:lichess:v1';
const PKCE_KEY = 'wp:lichess:pkce';

const redirectUri = () => location.origin + location.pathname;

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomString = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

export function getAuth() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function setAuth(a) {
  if (a) localStorage.setItem(KEY, JSON.stringify(a));
  else localStorage.removeItem(KEY);
}

export async function login() {
  const verifier = randomString();
  const state = randomString();
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  localStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, back: location.hash }));
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES.join(' '),
    state,
  });
  location.href = `${HOST}/oauth?${p}`;
}

// Llamar al arrancar: completa el login si volvemos de Lichess con ?code=...
export async function handleRedirect() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (!code && !error) return null;
  const pkce = JSON.parse(localStorage.getItem(PKCE_KEY) || 'null');
  localStorage.removeItem(PKCE_KEY);
  history.replaceState(null, '', redirectUri() + (pkce?.back || ''));
  if (error) throw new Error('Lichess: ' + (url.searchParams.get('error_description') || error));
  if (!pkce || pkce.state !== state) throw new Error('La respuesta de Lichess no coincide; vuelve a intentarlo.');
  const res = await fetch(`${HOST}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: pkce.verifier,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
    }),
  });
  if (!res.ok) throw new Error('No se pudo completar el login con Lichess (' + res.status + ')');
  const tok = await res.json();
  const auth = { token: tok.access_token, expiresAt: Date.now() + (tok.expires_in || 0) * 1000 };
  setAuth(auth);
  await refreshAccount();
  return getAuth();
}

export async function refreshAccount() {
  const auth = getAuth();
  if (!auth) return null;
  const res = await fetch(`${HOST}/api/account`, { headers: { Authorization: 'Bearer ' + auth.token } });
  if (res.status === 401) { setAuth(null); return null; }
  if (!res.ok) return auth;
  const acc = await res.json();
  auth.username = acc.username;
  auth.puzzleRating = acc.perfs?.puzzle?.rating || null;
  setAuth(auth);
  return auth;
}

export async function logout() {
  const auth = getAuth();
  setAuth(null);
  if (auth) fetch(`${HOST}/api/token`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + auth.token } }).catch(() => {});
}

export function authHeaders() {
  const a = getAuth();
  return a ? { Authorization: 'Bearer ' + a.token } : {};
}
