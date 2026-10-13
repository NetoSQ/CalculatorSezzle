import { useEffect, useState } from 'react';
import { calculate, type Operation } from './calculatorApi';

const symbols: Partial<Record<Operation, string>> = {
  add: '+', subtract: '−', multiply: '×', divide: '÷', power: '^',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(value);
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOperation, setPendingOperation] = useState<Operation | null>(null);
  const [startNewEntry, setStartNewEntry] = useState(false);
  const [expression, setExpression] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function enterDigit(digit: string) {
    setMessage('');
    if (startNewEntry || display === 'Error') {
      setDisplay(digit);
      setStartNewEntry(false);
      return;
    }
    if (display.replace('-', '').replace('.', '').length >= 14) return;
    setDisplay(display === '0' ? digit : `${display}${digit}`);
  }

  function enterDecimal() {
    setMessage('');
    if (startNewEntry || display === 'Error') {
      setDisplay('0.');
      setStartNewEntry(false);
    } else if (!display.includes('.')) {
      setDisplay(`${display}.`);
    }
  }

  function clear() {
    setDisplay('0');
    setStoredValue(null);
    setPendingOperation(null);
    setStartNewEntry(false);
    setExpression('');
    setMessage('');
  }

  function backspace() {
    setMessage('');
    if (startNewEntry || display === 'Error') {
      setDisplay('0');
      setStartNewEntry(false);
      return;
    }
    const next = display.slice(0, -1);
    setDisplay(next === '' || next === '-' ? '0' : next);
  }

  function toggleSign() {
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
    setMessage('');
  }

  async function runUnary(operation: 'sqrt' | 'percent') {
    if (busy || display === 'Error') return;
    setBusy(true);
    setMessage('');
    const input = Number(display);
    setExpression(operation === 'sqrt' ? `√(${formatNumber(input)})` : `${formatNumber(input)}%`);
    try {
      const result = await calculate({ operation, a: input });
      setDisplay(String(result));
      setStoredValue(null);
      setPendingOperation(null);
      setStartNewEntry(true);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Calculation failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function chooseOperation(operation: Operation) {
    if (busy || display === 'Error') return;
    setMessage('');
    let left = Number(display);

    if (pendingOperation && storedValue !== null && !startNewEntry) {
      setBusy(true);
      try {
        left = await calculate({ operation: pendingOperation, a: storedValue, b: left });
        setDisplay(String(left));
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : 'Calculation failed. Try again.');
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    setStoredValue(left);
    setPendingOperation(operation);
    setStartNewEntry(true);
    setExpression(`${formatNumber(left)} ${symbols[operation] ?? ''}`);
  }

  async function equals() {
    if (busy || pendingOperation === null || storedValue === null || startNewEntry || display === 'Error') return;
    const right = Number(display);
    setBusy(true);
    setMessage('');
    setExpression(`${formatNumber(storedValue)} ${symbols[pendingOperation]} ${formatNumber(right)} =`);
    try {
      const result = await calculate({ operation: pendingOperation, a: storedValue, b: right });
      setDisplay(String(result));
      setStoredValue(null);
      setPendingOperation(null);
      setStartNewEntry(true);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Calculation failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))) return;
      if (target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
      if (busy) return;

      if (/^\d$/.test(event.key)) enterDigit(event.key);
      else if (event.key === '.') enterDecimal();
      else if (event.key === 'Backspace') backspace();
      else if (event.key === 'Escape') clear();
      else if (event.key === 'Enter' || event.key === '=') equals();
      else if (event.key === '+') chooseOperation('add');
      else if (event.key === '-') chooseOperation('subtract');
      else if (event.key === '*') chooseOperation('multiply');
      else if (event.key === '/') chooseOperation('divide');
      else if (event.key === '^') chooseOperation('power');
      else if (event.key === '%') runUnary('percent');
      else if (event.key.toLowerCase() === 'r') runUnary('sqrt');
      else return;

      event.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, display, startNewEntry, pendingOperation, storedValue]);

  return (
    <main className="app-shell">
      <section className="calculator" aria-label="Calculator">
        <header className="calculator-header">
          <div className="calculator-brand"><span className="brand-icon">∑</span><span>CALCULATOR</span></div>
          <span className="api-status"><i /> GO ENGINE</span>
        </header>

        <div className="display-panel" aria-live="polite" aria-atomic="true">
          <div className="expression-line">{expression || '\u00a0'}</div>
          <output className="display-value" aria-label="Display">{display}</output>
          <div className={`display-message ${message ? 'visible' : ''}`} role={message ? 'alert' : undefined}>{message || '\u00a0'}</div>
        </div>

        <div className="keypad-tools" aria-label="Calculator functions">
          <button className="key key-function" onClick={clear} disabled={busy} aria-label="All clear">AC</button>
          <button className="key key-function" onClick={backspace} disabled={busy} aria-label="Delete last digit">DEL</button>
          <button className="key key-function" onClick={() => void runUnary('sqrt')} disabled={busy} aria-label="Square root">√x</button>
          <button className="key key-function" onClick={() => void runUnary('percent')} disabled={busy} aria-label="Percent">%</button>
          <button className="key key-function" onClick={toggleSign} disabled={busy} aria-label="Change sign">+/−</button>
          <button className={`key key-operator ${pendingOperation === 'power' ? 'active' : ''}`} onClick={() => void chooseOperation('power')} disabled={busy} aria-label="Raise to a power">xʸ</button>
        </div>

        <div className="keypad" aria-label="Calculator keys">
          <button className="key key-number" onClick={() => enterDigit('7')} disabled={busy}>7</button>
          <button className="key key-number" onClick={() => enterDigit('8')} disabled={busy}>8</button>
          <button className="key key-number" onClick={() => enterDigit('9')} disabled={busy}>9</button>
          <button className={`key key-operator ${pendingOperation === 'divide' ? 'active' : ''}`} onClick={() => void chooseOperation('divide')} disabled={busy} aria-label="Divide">÷</button>

          <button className="key key-number" onClick={() => enterDigit('4')} disabled={busy}>4</button>
          <button className="key key-number" onClick={() => enterDigit('5')} disabled={busy}>5</button>
          <button className="key key-number" onClick={() => enterDigit('6')} disabled={busy}>6</button>
          <button className={`key key-operator ${pendingOperation === 'multiply' ? 'active' : ''}`} onClick={() => void chooseOperation('multiply')} disabled={busy} aria-label="Multiply">×</button>

          <button className="key key-number" onClick={() => enterDigit('1')} disabled={busy}>1</button>
          <button className="key key-number" onClick={() => enterDigit('2')} disabled={busy}>2</button>
          <button className="key key-number" onClick={() => enterDigit('3')} disabled={busy}>3</button>
          <button className={`key key-operator ${pendingOperation === 'subtract' ? 'active' : ''}`} onClick={() => void chooseOperation('subtract')} disabled={busy} aria-label="Subtract">−</button>

          <button className="key key-number key-zero" onClick={() => enterDigit('0')} disabled={busy}>0</button>
          <button className="key key-number" onClick={enterDecimal} disabled={busy} aria-label="Decimal point">.</button>
          <button className={`key key-operator ${pendingOperation === 'add' ? 'active' : ''}`} onClick={() => void chooseOperation('add')} disabled={busy} aria-label="Add">+</button>
          <button className="key key-equals" onClick={() => void equals()} disabled={busy} aria-label="Equals">{busy ? '…' : '='}</button>
        </div>
        <footer className="calculator-footer"><span>ESC clears</span><span>ENTER calculates</span></footer>
      </section>
    </main>
  );
}
