import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculate } from './calculatorApi';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function mockResponse(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('calculate API client', () => {
  it('sends the operation and returns the server result', async () => {
    const request = mockResponse({ result: 9 });
    await expect(calculate({ operation: 'multiply', a: 3, b: 3 })).resolves.toBe(9);
    expect(request).toHaveBeenCalledWith(expect.stringContaining('/api/calculate'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ operation: 'multiply', a: 3, b: 3 }),
    }));
  });

  it('surfaces API validation errors', async () => {
    mockResponse({ error: 'division by zero' }, false);
    await expect(calculate({ operation: 'divide', a: 4, b: 0 })).rejects.toThrow('division by zero');
  });

  it('rejects malformed success responses', async () => {
    mockResponse({ result: 'oops' });
    await expect(calculate({ operation: 'sqrt', a: 4 })).rejects.toThrow('invalid result');
  });

  it('sends unary operations without a second operand', async () => {
    const request = mockResponse({ result: 0.25 });
    await expect(calculate({ operation: 'percent', a: 25 })).resolves.toBe(0.25);
    expect(request).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'percent', a: 25 }),
    }));
  });

  it('rejects non-finite results', async () => {
    mockResponse({ result: Number.POSITIVE_INFINITY });
    await expect(calculate({ operation: 'power', a: 10, b: 10 })).rejects.toThrow('invalid result');
  });

  it('reports a useful message when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(calculate({ operation: 'add', a: 1, b: 2 })).rejects.toThrow('Failed to fetch');
  });
});
