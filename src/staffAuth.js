export const STAFF_PERMISSION_OPTIONS = [
  { id: 'rates', label: 'Rates' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'orders', label: 'Orders' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'clients', label: 'Clients' },
];

export function normalizeStaffAccount(account) {
  const role = account?.role || 'Staff';
  const authorizedFor = Array.isArray(account?.authorizedFor)
    ? account.authorizedFor.filter(Boolean)
    : [];

  return {
    id: account?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: account?.name || 'Staff User',
    email: String(account?.email || '').trim().toLowerCase(),
    password: String(account?.password || ''),
    role,
    authorizedFor,
    createdAt: account?.createdAt || new Date().toISOString(),
  };
}

export function authorizeStaffLogin(staffAccounts, { email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const account = (staffAccounts || []).map(normalizeStaffAccount).find(
    (item) => item.email === normalizedEmail && item.password === normalizedPassword
  );
  return account || null;
}

export function hasStaffAccess(account, permission) {
  if (!account) return true;
  const role = String(account?.role || '').toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'super admin' || role === 'super-admin') return true;
  return (account?.authorizedFor || []).includes(permission);
}
