// Simple admin user management
// In a real application, this would be stored in a database

interface AdminUser {
  username: string
  password: string
  created: boolean
}

// Default admin user
const defaultAdmin: AdminUser = {
  username: 'admin',
  password: '123456qq',
  created: true
}

export function checkAdminExists(): boolean {
  // In this simple implementation, admin always exists
  // In a real app, you would check the database
  return defaultAdmin.created
}

export function createAdminUser(): AdminUser {
  // In a real app, you would create the user in the database
  console.log('Admin user created:', defaultAdmin.username)
  return defaultAdmin
}

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === defaultAdmin.username && password === defaultAdmin.password
}

export function getAdminUser(): AdminUser | null {
  if (checkAdminExists()) {
    return defaultAdmin
  }
  return null
}
