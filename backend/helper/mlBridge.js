const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const AppError = require('./AppError');
const cache = require('./cache');

/**
 * Executes the Python prediction script with the provided image buffer.
 * Tries python, py, and python3 executables for cross-platform compatibility.
 * Checks in-memory cache using MD5 image hash for instant duplicate predictions.
 * Returns a promise that resolves with the parsed JSON result.
 */
exports.predict = (imageBuffer) => {
  return new Promise((resolve, reject) => {
    // Check in-memory hash cache first
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    if (cache.has(imageHash)) {
      return resolve(cache.get(imageHash));
    }

    const scriptPath = path.join(__dirname, '..', 'ml_models', 'predict.py');
    const pythonCommands = process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python'];
    let attempt = 0;

    const run = () => {
      if (attempt >= pythonCommands.length) {
        return reject(new AppError('Python executable not found. Please ensure Python is installed and added to PATH.', 500));
      }
      const cmd = pythonCommands[attempt++];
      const proc = spawn(cmd, [scriptPath]);
      let stdout = '';
      let stderr = '';

      proc.stdin.write(imageBuffer);
      proc.stdin.end();

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('error', (err) => {
        console.error(`Failed to spawn ${cmd}:`, err.message);
        run(); // try next executable
      });

      proc.on('close', (code) => {
        try {
          const match = stdout.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.error) {
              return reject(new AppError(`ML Engine error: ${parsed.error}`, 400));
            }
            cache.set(imageHash, parsed);
            return resolve(parsed);
          }
          if (code !== 0) {
            return reject(new AppError(`ML Engine failed (code ${code}): ${stderr || stdout || 'Unknown error'}`, 500));
          }
          reject(new AppError('Invalid response received from ML engine.', 500));
        } catch (e) {
          reject(new AppError(`Failed to parse ML output: ${e.message}`, 500));
        }
      });
    };

    run();
  });
};