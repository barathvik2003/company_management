import { redact } from './audit.service';

describe('audit redaction', () => {
  it('removes secrets at any depth', () => {
    const input = {
      email: 'user@example.com',
      password: 'hunter2',
      nested: { refreshToken: 'abc', apiKey: 'sk-live-123', keep: 'visible' },
      list: [{ currentPassword: 'x', role: 'ADMIN' }],
    };

    expect(redact(input)).toEqual({
      email: 'user@example.com',
      password: '[redacted]',
      nested: { refreshToken: '[redacted]', apiKey: '[redacted]', keep: 'visible' },
      list: [{ currentPassword: '[redacted]', role: 'ADMIN' }],
    });
  });

  it('is case-insensitive about key names', () => {
    expect(redact({ PassWord: 'x', Authorization: 'Bearer y' })).toEqual({
      PassWord: '[redacted]',
      Authorization: '[redacted]',
    });
  });
});
