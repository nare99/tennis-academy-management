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
