/**
 * Sairin Demo
 * Interactive demonstration of Sairin reactive framework features
 * 
 * Sairin now automatically creates a Satori instance for logging!
 */

import { signal, effect, derived, batch, path, isFlushing, hasPendingEffects, configureSairin, lock, unlock, isLocked } from './dist/index.mjs';

// Configure Sairin
configureSairin({
  lockViolation: "warn",  // Warn on lock violations (don't throw)
});

// Global state
let metrics = {
  signalUpdates: 0,
  effectRuns: 0,
  derivedRecomputes: 0,
  batchUpdates: 0,
};

// Create signals
const counter = signal(path("demo", "counter"), 0);
const text = signal(path("demo", "text"), "Hello Sairin!");
const flag = signal(path("demo", "flag"), true);

// Derived values
const doubled = derived(path("demo", "doubled"), () => {
  metrics.derivedRecomputes++;
  updateMetrics();
  return counter.get() * 2;
});

const squared = derived(path("demo", "squared"), () => {
  return counter.get() ** 2;
});

const isEven = derived(path("demo", "isEven"), () => {
  return counter.get() % 2 === 0;
});

// Effect that runs on counter change
const counterEffect = effect(() => {
  const value = counter.get();
  metrics.effectRuns++;
  addEffectLog("counterEffect", `Counter changed to ${value}`);
  updateMetrics();
});

// Effect that runs on derived value
const derivedEffect = effect(() => {
  const d = doubled.get();
  addEffectLog("derivedEffect", `Doubled is now ${d}`);
});

// Effect that monitors flush state
effect(() => {
  const flushing = isFlushing();
  const pending = hasPendingEffects();
  document.getElementById('metricFlushing').textContent = flushing ? "yes" : "no";
});

// DOM Elements
const elements = {
  counterValue: document.getElementById('counterValue'),
  doubledValue: document.getElementById('doubledValue'),
  squaredValue: document.getElementById('squaredValue'),
  isEvenValue: document.getElementById('isEvenValue'),
  batchStatus: document.getElementById('batchStatus'),
  effectLogList: document.getElementById('effectLogList'),
  metricSignals: document.getElementById('metricSignals'),
  metricEffects: document.getElementById('metricEffects'),
  metricDerived: document.getElementById('metricDerived'),
  metricBatches: document.getElementById('metricBatches'),
  metricPending: document.getElementById('metricPending'),
  metricFlushing: document.getElementById('metricFlushing'),
  graphVisualization: document.getElementById('graphVisualization'),
  codeInput: document.getElementById('codeInput'),
  codeOutput: document.getElementById('codeOutput'),
};

// Update UI
function updateCounter() {
  elements.counterValue.textContent = counter.get();
}

function updateDerived() {
  elements.doubledValue.textContent = doubled.get();
  elements.squaredValue.textContent = squared.get();
  elements.isEvenValue.textContent = isEven.get() ? "true" : "false";
}

function updateMetrics() {
  elements.metricSignals.textContent = metrics.signalUpdates;
  elements.metricEffects.textContent = metrics.effectRuns;
  elements.metricDerived.textContent = metrics.derivedRecomputes;
  elements.metricBatches.textContent = metrics.batchUpdates;
  elements.metricPending.textContent = hasPendingEffects() ? "yes" : "no";
}

function addEffectLog(name, message) {
  const placeholder = elements.effectLogList.querySelector('.effect-log-placeholder');
  if (placeholder) {
    placeholder.remove();
  }
  
  const entry = document.createElement('div');
  entry.className = 'effect-log-entry';
  
  const timestamp = new Date().toLocaleTimeString();
  entry.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="effect-name">${name}:</span>
    <span class="value">${message}</span>
  `;
  
  elements.effectLogList.insertBefore(entry, elements.effectLogList.firstChild);
  
  // Keep only last 20 entries
  while (elements.effectLogList.children.length > 20) {
    elements.effectLogList.removeChild(elements.effectLogList.lastChild);
  }
}

function updateGraph() {
  const nodes = [
    { name: 'counter', type: 'signal', value: counter.get() },
    { name: 'text', type: 'signal', value: `"${text.get().substring(0, 10)}..."` },
    { name: 'flag', type: 'signal', value: flag.get() },
    { name: 'doubled', type: 'derived', value: doubled.get() },
    { name: 'squared', type: 'derived', value: squared.get() },
    { name: 'isEven', type: 'derived', value: isEven.get() },
  ];
  
  let html = '';
  
  // Signal nodes
  html += '<div style="margin-bottom: 1rem;">';
  html += '<strong>Signals:</strong><br>';
  nodes.filter(n => n.type === 'signal').forEach(node => {
    html += `<span class="graph-node signal">${node.name} = ${node.value}</span>`;
  });
  html += '</div>';
  
  // Edges
  html += '<div style="margin: 0.5rem 0; color: var(--color-text-muted);">↓ depends on</div>';
  
  // Derived nodes
  html += '<div>';
  html += '<strong>Derived:</strong><br>';
  nodes.filter(n => n.type === 'derived').forEach(node => {
    html += `<span class="graph-node derived">${node.name} = ${node.value}</span>`;
  });
  html += '</div>';
  
  elements.graphVisualization.innerHTML = html;
}

// Subscribe to updates
counter.subscribe(() => {
  metrics.signalUpdates++;
  updateCounter();
  updateDerived();
  updateGraph();
  updateMetrics();
});

doubled.subscribe(() => {
  updateDerived();
  updateGraph();
});

squared.subscribe(() => {
  updateDerived();
});

isEven.subscribe(() => {
  updateDerived();
});

// Button handlers
document.getElementById('incrementBtn').addEventListener('click', () => {
  counter.update(c => c + 1);
});

document.getElementById('decrementBtn').addEventListener('click', () => {
  counter.update(c => c - 1);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  counter.set(0);
});

document.getElementById('batchBtn').addEventListener('click', () => {
  metrics.batchUpdates++;
  
  batch(() => {
    counter.set(Math.floor(Math.random() * 100));
    text.set("Updated at " + new Date().toLocaleTimeString());
    flag.set(!flag.get());
  });
  
  elements.batchStatus.textContent = `Updated at ${new Date().toLocaleTimeString()}`;
  updateMetrics();
});

document.getElementById('clearEffectLog').addEventListener('click', () => {
  elements.effectLogList.innerHTML = '<div class="effect-log-placeholder">Effects will appear here...</div>';
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', next);
});

// Code execution
elements.codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    executeCode();
  }
});

function executeCode() {
  const code = elements.codeInput.value.trim();
  if (!code) return;
  
  try {
    // Create a safe evaluation context
    const context = {
      counter,
      text,
      flag,
      doubled,
      squared,
      isEven,
      signal,
      effect,
      derived,
      batch,
      path,
      lock: (path, opts) => lock(path, opts || { owner: 'demo' }),
      unlock,
      isLocked,
    };
    
    // Execute the code
    const fn = new Function(...Object.keys(context), code);
    const result = fn(...Object.values(context));
    
    if (result !== undefined) {
      elements.codeOutput.textContent = String(result);
    } else {
      elements.codeOutput.textContent = '(executed successfully - check console for logs)';
    }
  } catch (error) {
    elements.codeOutput.textContent = `Error: ${error.message}`;
  }
}

// Initial render
updateCounter();
updateDerived();
updateGraph();
updateMetrics();
addEffectLog("init", "Demo initialized");
