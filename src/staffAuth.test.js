import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeStaffLogin, hasStaffAccess, STAFF_PERMISSION_OPTIONS } from './staffAuth.js';

test('authorizeStaffLogin matches staff email and password', () => {
  const result = authorizeStaffLogin([
    { id: '1', name: 'Asha', email: 'asha@nsheera.com', password: 'staff123', role: 'Manager', authorizedFor: ['rates', 'orders'] },
  ], { email: 'asha@nsheera.com', password: 'staff123' });

  assert.equal(result?.name, 'Asha');
  assert.deepEqual(STAFF_PERMISSION_OPTIONS.map((p) => p.id).slice(0, 2), ['rates', 'catalog']);
});

test('hasStaffAccess respects role-based permissions', () => {
  const account = { role: 'Manager', authorizedFor: ['orders'] };
  assert.equal(hasStaffAccess(account, 'orders'), true);
  assert.equal(hasStaffAccess(account, 'clients'), false);
});
