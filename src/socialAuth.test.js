import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProviderAuthUrl, parseSocialAuthResponse } from './socialAuth.js';

function makeJwtPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `eyJhbGciOiJub25lIn0.${encoded}.signature`;
}

test('buildProviderAuthUrl creates the expected Google URL', () => {
  const url = buildProviderAuthUrl('google', {
    clientId: 'abc123',
    redirectUri: 'https://example.com/auth/callback',
    state: 'state-1',
  });

  assert.match(url, /https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
  assert.match(url, /client_id=abc123/);
  assert.match(url, /redirect_uri=https%3A%2F%2Fexample\.com%2Fauth%2Fcallback/);
  assert.match(url, /state=state-1/);
});

test('parseSocialAuthResponse decodes token payloads for Google and Apple', () => {
  const googlePayload = parseSocialAuthResponse('google', {
    id_token: makeJwtPayload({ name: 'Ada', email: 'ada@example.com' }),
  });
  assert.equal(googlePayload.name, 'Ada');

  const applePayload = parseSocialAuthResponse('apple', {
    id_token: makeJwtPayload({ email: 'ada@example.com' }),
  });
  assert.equal(applePayload.email, 'ada@example.com');
});
