import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrainersController } from './trainers.controller';

describe('TrainersController authorization metadata', () => {
  const adminMethods = [
    'findAll',
    'create',
    'update',
    'updateStatus',
    'issueInvitation',
  ] as const;

  for (const method of adminMethods) {
    it(`${method} requires an authenticated administrator`, () => {
      const handler = TrainersController.prototype[method];

      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
        SessionAuthGuard,
        RolesGuard,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        UserRole.ADMIN,
      ]);
    });
  }

  it('keeps invitation acceptance public', () => {
    const handler = TrainersController.prototype.acceptInvitation;

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
  });
});
