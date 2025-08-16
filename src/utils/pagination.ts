import { EntityManager, EntityClass, FilterQuery } from '@mikro-orm/core';
import { PaginationResponse } from '@schemas/pagination.schema';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationOptions<T> {
  where?: FilterQuery<T>;
  populate?: readonly string[] | boolean;
  orderBy?: Record<keyof T, 'ASC' | 'DESC' | 'asc' | 'desc'>;
}

export async function paginate<T extends object>(
  em: EntityManager,
  entityClass: EntityClass<T>,
  params: PaginationParams,
  options?: PaginationOptions<T>
): Promise<PaginationResponse<T>> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const [data, total] = await em.findAndCount(
    entityClass,
    options?.where || ({} as FilterQuery<T>),
    {
      limit,
      offset,
      populate: options?.populate as any,
      orderBy: options?.orderBy as any,
    }
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
