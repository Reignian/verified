// fileName: metricsService.js
// Simple terminal metrics logger for major processes

const { performance } = require('perf_hooks');

/**
 * Log a metrics event to the terminal.
 *
 * @param {Object} params
 * @param {string} params.name - Logical name of the process/function
 * @param {number} params.durationMs - Total runtime in milliseconds
 * @param {number} [params.inputSize] - Size of input processed (e.g., characters, bytes)
 * @param {number} [params.outputSize] - Size of output generated
 * @param {number} [params.accuracy] - Accuracy or similarity percentage (0-100)
 * @param {Object} [params.extra] - Any extra metadata
 */
function logMetric({ name, durationMs, inputSize, outputSize, accuracy, extra }) {
  // Allow disabling metrics via environment variable
  if (process.env.METRICS_ENABLED === 'false') return;

  const timestamp = new Date().toISOString();

  let throughput = null;
  if (typeof inputSize === 'number' && durationMs > 0) {
    throughput = inputSize / (durationMs / 1000); // units per second
  }

  console.log(`\n[METRIC] ${timestamp} :: ${name}`);
  console.log(`  duration_ms: ${durationMs.toFixed(2)}`);

  if (typeof inputSize === 'number') {
    console.log(`  input_size: ${inputSize}`);
  }

  if (typeof outputSize === 'number') {
    console.log(`  output_size: ${outputSize}`);
  }

  if (throughput !== null) {
    console.log(`  throughput_units_per_sec: ${throughput.toFixed(2)}`);
  }

  if (typeof accuracy === 'number') {
    console.log(`  accuracy_pct: ${accuracy.toFixed(2)}`);
  }

  if (extra && Object.keys(extra).length > 0) {
    console.log('  extra:', extra);
  }
}

/**
 * Convenience helper to measure an async operation.
 *
 * @param {string} name - Metric name
 * @param {Function} fn - Async function to execute
 * @param {Object} [context] - Context info (inputSize, outputSize, etc.)
 */
async function measureAsync(name, fn, context = {}) {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = performance.now() - start;
    logMetric({ name, durationMs, ...context });
    return result;
  } catch (error) {
    const durationMs = performance.now() - start;
    logMetric({
      name,
      durationMs,
      ...context,
      extra: { ...(context.extra || {}), error: error.message }
    });
    throw error;
  }
}

module.exports = {
  logMetric,
  measureAsync,
};
