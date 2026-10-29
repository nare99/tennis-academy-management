
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from './auth.types';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const getAllAndOverride = jest.fn();

  const reflector = {
    getAllAndOverride,
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const createContext = (
    user?: AuthenticatedRequest['user'],
  ): ExecutionContext => {
    const handler = jest.fn();
    const controller = jest.fn();
  
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    getAllAndOverride.mockReset();
  });

  it('allows access when no roles are required', () => {
    getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows a user with a required role', () => {
    getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const user: AuthenticatedRequest['user'] = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    };

    expect(guard.canActivate(createContext(user))).toBe(true);

    expect(getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it('rejects a user without the required role', () => {
    getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const user: AuthenticatedRequest['user'] = {
      id: 'customer-1',
      email: 'customer@example.com',
      name: 'Customer',
      role: UserRole.CUSTOMER,
      isActive: true,
    };

    expect(() => guard.canActivate(createContext(user))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a request without an authenticated user', () => {
    getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });
});
