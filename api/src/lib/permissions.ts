export type Capability = 'view' | 'courses' | 'users' | 'orders' | 'support' | 'publish' | 'admins'

const SUPER_ONLY: Capability[] = ['publish', 'admins']

export function can(
  staffUser: { role: string; isSuperAdmin: boolean; permissions: string[] },
  capability: Capability
): boolean {
  if (staffUser.role !== 'staff') return false
  if (staffUser.isSuperAdmin) return true
  if (SUPER_ONLY.includes(capability)) return false
  return staffUser.permissions.includes(capability)
}
