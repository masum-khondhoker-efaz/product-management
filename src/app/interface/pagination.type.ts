export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface IPaginationResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ISearchAndFilterOptions extends IPaginationOptions {
  searchTerm?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  offset?: number;

  category?: string;
  priceMin?: number;
  priceMax?: number;
  discountPriceMin?: number;
  discountPriceMax?: number;
  rating?: number;
  isActive?: boolean | string;
  startDate?: string;
  endDate?: string;
  subscriptionType?: string;
  duration?: string;
  stockMin?: number;
  stockMax?: number;
  stock?: number;

  userStatus?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  isProfileComplete?: boolean | string;

  name?: string;
  priceRange?: 'low' | 'medium' | 'high';


  orderStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  orderDateStart?: string;
  orderDateEnd?: string;

  status?: string;
  userEmail?: string;
  userPhone?: string;

  paymentStatus?: string;
}
