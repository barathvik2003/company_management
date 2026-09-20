/** Every API response uses one of these two shapes. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SessionUser {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: Array<{ key: string; scope: string }>;
}
