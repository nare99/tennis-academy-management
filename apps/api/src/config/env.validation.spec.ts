import { validateEnvironment } from './env.validation';

const baseEnvironment = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://tennis:password@localhost:5432/tennis_academy',
};

describe('validateEnvironment', () => {
  it('requires an invitation URL in production', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow(/TRAINER_INVITATION_BASE_URL is required in production/);
  });

  it('rejects HTTP invitation URLs in production', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        TRAINER_INVITATION_BASE_URL: 'http://academy.example.com/accept-invitation',
      }),
    ).toThrow(/must use HTTPS in production/);
  });

  it('accepts HTTPS invitation URLs in production', () => {
    expect(
      validateEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        TRAINER_INVITATION_BASE_URL: 'https://academy.example.com/accept-invitation',
      }).TRAINER_INVITATION_BASE_URL,
    ).toBe('https://academy.example.com/accept-invitation');
  });

  it('allows HTTP localhost invitation URLs outside production', () => {
    expect(
      validateEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'development',
        TRAINER_INVITATION_BASE_URL: 'http://localhost:5174/accept-invitation',
      }).TRAINER_INVITATION_BASE_URL,
    ).toBe('http://localhost:5174/accept-invitation');
  });

  it('rejects non-HTTP protocols outside production too', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnvironment,
        TRAINER_INVITATION_BASE_URL: 'javascript:alert(1)',
      }),
    ).toThrow(/must use HTTP or HTTPS/);
  });
});
