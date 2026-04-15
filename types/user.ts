export interface User {
  uid?: string;
  fullName: string;
  username: string;
  password?: string;
  email: string;
  role?: 'admin' | 'user' | 'employee' | 'superadmin';
  company?: string;
  createdAt?: Date | any;
  lastLogin?: Date;
  isActive?: boolean;
}
