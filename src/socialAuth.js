function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const decoded = typeof atob === 'function'
    ? atob(padded)
    : Buffer.from(padded, 'base64').toString('binary');
  let json;
  try {
    json = decodeURIComponent(
      decoded.split('').map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
  } catch (err) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

export function buildProviderAuthUrl(provider, { clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider === 'apple' ? 'name email' : 'openid profile email',
    state,
  });

  const baseUrls = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    facebook: 'https://www.facebook.com/dialog/oauth',
    apple: 'https://appleid.apple.com/auth/authorize',
  };

  const baseUrl = baseUrls[provider];
  if (!baseUrl) throw new Error(`Unsupported provider: ${provider}`);
  return `${baseUrl}?${params.toString()}`;
}

export function parseSocialAuthResponse(provider, response) {
  if (provider === 'google' || provider === 'apple') {
    const payload = decodeJwtPayload(response?.id_token || response?.access_token || '');
    if (payload) {
      return {
        name: payload.name || payload.given_name || payload.email || 'Social User',
        email: payload.email || '',
        provider,
      };
    }
  }

  return {
    name: response?.name || 'Social User',
    email: response?.email || '',
    provider,
  };
}
