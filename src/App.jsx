import { useState, useEffect, useRef } from 'react';
import { History, Calculator, FlaskConical } from 'lucide-react';
import gsap from 'gsap';
import './styles.css';

const App = () => {
  // --- CORE STATE ---
  const [mode, setMode] = useState('standard'); 
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- REFS ---
  const calcRef = useRef(null);
  const displayRef = useRef(null);

  // --- ENTRANCE ANIMATION (Fixed for React Strict Mode) ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(calcRef.current, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'all' });
      gsap.from(displayRef.current, { y: 20, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power2.out', clearProps: 'all' });
      gsap.from('.btn', { y: 20, opacity: 0, duration: 0.5, stagger: 0.02, ease: 'back.out(1.7)', delay: 0.4, clearProps: 'all' });
    }, calcRef); 
    return () => ctx.revert();
  }, []);

  // --- THE MATH ENGINE ---

  // Helper: Fix JS floating-point precision issues
  const formatPrecision = (num) => Math.round(num * 1e10) / 1e10;

  // Helper: Safe math evaluator 
  const safeEvaluate = (expr) => {
    try {
      // Replace visual operators with actual JS operators
      const toEval = expr.replace(/×/g, '*').replace(/÷/g, '/');
      const result = new Function('return ' + toEval)();
      if (!isFinite(result) || isNaN(result)) return 'Error';
      return formatPrecision(result);
    } catch (e) {
      return 'Error';
    }
  };

  const handleInput = (val) => {
    if (display === 'Error') return;
    if (waitingForNewValue) {
      setDisplay(val === '.' ? '0.' : val);
      setWaitingForNewValue(false);
    } else {
      if (val === '.' && display.includes('.')) return; // Prevent "5.5.5"
      setDisplay(display === '0' && val !== '.' ? val : display + val);
    }
  };

  const handleOperator = (op) => {
    if (display === 'Error') return;
    const visualOp = op === '*' ? '×' : op === '/' ? '÷' : op;
    
    if (waitingForNewValue && equation) {
      // Switch operator if user changes their mind (e.g. hits + then hits *)
      setEquation(equation.slice(0, -1) + visualOp);
      return;
    }

    setEquation(`${equation} ${display} ${visualOp}`.trim());
    setWaitingForNewValue(true);
  };

  const calculateResult = () => {
    if (!equation || waitingForNewValue || display === 'Error') return;
    
    const fullEquation = `${equation} ${display}`;
    const result = safeEvaluate(fullEquation);
    
    // Save to History (Max 10 items)
    setHistory(prev => [{ equation: fullEquation, result: String(result) }, ...prev].slice(0, 10));
    
    setDisplay(String(result));
    setEquation('');
    setWaitingForNewValue(true);
  };

  const handleAction = (action) => {
    if (display === 'Error' && action !== 'AC') return;
    switch (action) {
      case 'AC':
        setDisplay('0');
        setEquation('');
        setWaitingForNewValue(false);
        break;
      case 'DEL':
        if (!waitingForNewValue) setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        break;
      case '+/-':
        setDisplay(String(formatPrecision(parseFloat(display) * -1)));
        break;
      case '%':
        setDisplay(String(formatPrecision(parseFloat(display) / 100)));
        setWaitingForNewValue(true);
        break;
    }
  };

  // --- SCIENTIFIC ENGINE ---
  const factorial = (n) => {
    if (n < 0 || !Number.isInteger(n)) return 'Error';
    if (n === 0 || n === 1) return 1;
    let res = 1; for (let i = 2; i <= n; i++) res *= i; return res;
  };

  const handleScientific = (fn) => {
    if (display === 'Error') return;
    const num = parseFloat(display);
    let res = 0; let eqStr = '';

    switch(fn) {
      case 'sin': res = Math.sin(num); eqStr = `sin(${num})`; break;
      case 'cos': res = Math.cos(num); eqStr = `cos(${num})`; break;
      case 'tan': res = Math.tan(num); eqStr = `tan(${num})`; break;
      case 'log': res = Math.log10(num); eqStr = `log(${num})`; break;
      case 'ln': res = Math.log(num); eqStr = `ln(${num})`; break;
      case '√': res = num < 0 ? 'Error' : Math.sqrt(num); eqStr = `√(${num})`; break;
      case 'x²': res = Math.pow(num, 2); eqStr = `sqr(${num})`; break;
      case '1/x': res = num === 0 ? 'Error' : 1 / num; eqStr = `1/(${num})`; break;
      case '|x|': res = Math.abs(num); eqStr = `abs(${num})`; break;
      case 'π': res = Math.PI; eqStr = `π`; setWaitingForNewValue(true); break;
      case 'e': res = Math.E; eqStr = `e`; setWaitingForNewValue(true); break;
      case 'n!': res = factorial(num); eqStr = `fact(${num})`; break;
    }

    if (res !== 'Error') res = formatPrecision(res);
    setDisplay(String(res));
    setWaitingForNewValue(true);
    
    if(fn !== 'π' && fn !== 'e') {
      setHistory(prev => [{ equation: eqStr, result: String(res) }, ...prev].slice(0, 10));
    }
  };

  // --- KEYBOARD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;
      if (/[0-9.]/.test(key)) { e.preventDefault(); handleInput(key); }
      if (['+', '-', '*', '/'].includes(key)) { e.preventDefault(); handleOperator(key); }
      if (key === 'Enter' || key === '=') { e.preventDefault(); calculateResult(); }
      if (key === 'Escape') { e.preventDefault(); handleAction('AC'); }
      if (key === 'Backspace') { e.preventDefault(); handleAction('DEL'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation, waitingForNewValue]);

  // --- UI RENDERERS ---
  const renderMemoryRow = () => (
    <div className="memory-row">
      <button className="mem-btn" onClick={() => setMemory(0)}>MC</button>
      <button className="mem-btn" onClick={() => { setDisplay(String(memory)); setWaitingForNewValue(true); }}>MR</button>
      <button className="mem-btn" onClick={() => setMemory(prev => prev + parseFloat(display || 0))}>M+</button>
      <button className="mem-btn" onClick={() => setMemory(prev => prev - parseFloat(display || 0))}>M-</button>
      <button className="mem-btn" onClick={() => setMemory(parseFloat(display || 0))}>MS</button>
    </div>
  );

  return (
    <div className="app-container">
      <div className="grid-background"></div>
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      <main className="calculator liquid-glass" ref={calcRef}>
        
        <header className="calc-header">
          <div className="mode-toggles">
            <button className={`toggle-btn ${mode === 'standard' ? 'active' : ''}`} onClick={() => setMode('standard')}>
              <Calculator size={16} /> Standard
            </button>
            <button className={`toggle-btn ${mode === 'scientific' ? 'active' : ''}`} onClick={() => setMode('scientific')}>
              <FlaskConical size={16} /> Scientific
            </button>
          </div>
          <button className={`history-toggle ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(!showHistory)}>
            <History size={20} />
          </button>
        </header>

        <div className="display-screen" ref={displayRef}>
          {memory !== 0 && <span className="memory-indicator">M</span>}
          <div className="equation-readout">{equation || '\u00A0'}</div>
          <div className="main-readout" style={{ fontSize: display.length > 10 ? '2.5rem' : '4rem' }}>
            {display}
          </div>
        </div>

        {renderMemoryRow()}

        <div className={`keypad ${mode}`}>
          {mode === 'scientific' && (
            <div className="scientific-pad">
              {['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', '1/x', '|x|', 'π', 'e', 'n!'].map(fn => (
                <button key={fn} className="btn btn-sci" onClick={() => handleScientific(fn)}>{fn}</button>
              ))}
            </div>
          )}

          <div className="standard-pad">
            <button className="btn btn-action text-accent" onClick={() => handleAction('AC')}>AC</button>
            <button className="btn btn-action" onClick={() => handleAction('+/-')}>+/-</button>
            <button className="btn btn-action" onClick={() => handleAction('%')}>%</button>
            <button className="btn btn-operator" onClick={() => handleOperator('/')}>÷</button>

            {[7, 8, 9].map(num => <button key={num} className="btn btn-num" onClick={() => handleInput(String(num))}>{num}</button>)}
            <button className="btn btn-operator" onClick={() => handleOperator('*')}>×</button>

            {[4, 5, 6].map(num => <button key={num} className="btn btn-num" onClick={() => handleInput(String(num))}>{num}</button>)}
            <button className="btn btn-operator" onClick={() => handleOperator('-')}>−</button>

            {[1, 2, 3].map(num => <button key={num} className="btn btn-num" onClick={() => handleInput(String(num))}>{num}</button>)}
            <button className="btn btn-operator" onClick={() => handleOperator('+')}>+</button>

            <button className="btn btn-num zero-btn" onClick={() => handleInput('0')}>0</button>
            <button className="btn btn-num" onClick={() => handleInput('.')}>.</button>
            <button className="btn btn-equals" onClick={calculateResult}>=</button>
          </div>
        </div>

        {/* --- INTERACTIVE HISTORY DRAWER --- */}
        {showHistory && (
          <div className="history-drawer liquid-glass-inner">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
              <h3>Calculation History</h3>
              <button className="btn-action" style={{border:'none', background:'transparent'}} onClick={() => setShowHistory(false)}>Close</button>
            </div>
            {history.length === 0 ? <p className="text-muted">No history yet.</p> : history.map((h, i) => (
              <div key={i} className="history-item" onClick={() => {
                setDisplay(h.result);
                setShowHistory(false);
                setWaitingForNewValue(true);
              }}>
                <span className="hist-eq">{h.equation}</span>
                <span className="hist-res">={h.result}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;