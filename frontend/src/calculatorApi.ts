export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sqrt' | 'percent';

export type CalculateInput = { operation: Operation; a: number; b?: number };
export type CalculateResult = { result: number };

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function calculate(input: CalculateInput): Promise<number> {
  const response = await fetch(`${API_URL}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json() as CalculateResult | { error: string };
  if (!response.ok) {
    throw new Error('error' in payload ? payload.error : 'Calculation failed. Please try again.');
  }
  if (!('result' in payload) || !Number.isFinite(payload.result)) {
    throw new Error('The server returned an invalid result.');
  }
  return payload.result;
}
