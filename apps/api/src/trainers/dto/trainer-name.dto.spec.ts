import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTrainerDto } from './create-trainer.dto';
import { UpdateTrainerDto } from './update-trainer.dto';

describe('trainer name DTO validation', () => {
  it('rejects a whitespace-only name when creating a trainer', () => {
    const dto = plainToInstance(CreateTrainerDto, {
      email: 'coach@example.com',
      name: '   \t  ',
    });

    const errors = validateSync(dto);

    expect(errors.find((error) => error.property === 'name')?.constraints)
      .toHaveProperty('minLength');
    expect(dto.name).toBe('');
  });

  it('rejects a whitespace-only name when updating a trainer', () => {
    const dto = plainToInstance(UpdateTrainerDto, { name: '   \n ' });

    const errors = validateSync(dto);

    expect(errors.find((error) => error.property === 'name')?.constraints)
      .toHaveProperty('minLength');
    expect(dto.name).toBe('');
  });

  it('trims a valid name before validating it', () => {
    const dto = plainToInstance(CreateTrainerDto, {
      email: 'coach@example.com',
      name: '  Alex Morgan  ',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.name).toBe('Alex Morgan');
  });
});

describe('UpdateTrainerDto nullable and optional fields', () => {
  it.each(['email', 'name', 'currency'] as const)(
    'rejects null for non-nullable %s',
    (field) => {
      const dto = plainToInstance(UpdateTrainerDto, { [field]: null });

      expect(validateSync(dto)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: field }),
        ]),
      );
    },
  );

  it('allows omitted fields in a partial update', () => {
    const dto = plainToInstance(UpdateTrainerDto, {});

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('allows null for intentionally nullable profile fields', () => {
    const dto = plainToInstance(UpdateTrainerDto, {
      bio: null,
      hourlyRateMinor: null,
    });

    expect(validateSync(dto)).toHaveLength(0);
  });
});
