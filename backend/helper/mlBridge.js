const path = require('path');
const { spawn } = require('child_process');
const AppError = require('./AppError');

exports.predict = (imageBuffer) => {

  return new Promise((resolve, reject) => {

    const scriptPath = path.join(__dirname, '..', 'ml_models', 'predict.py');

    // Trying 'python' by default. If you use 'py' or 'python3', you'll want to change it here.
    const pythonProcess = spawn('python', [scriptPath]);

    let result = "";
    let errorData = "";

    pythonProcess.stdin.write(imageBuffer);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      // console.log("PYTHON STDOUT:", data.toString()); // Uncomment for debugging
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error("PYTHON STDERR:", data.toString());
      errorData += data.toString();
    });

    pythonProcess.on('error', (err) => {
      console.error("SPAWN ERROR. Python may not be installed or in PATH.", err);
      reject(new AppError(`ML Engine Spawn Error: Make sure Python is installed and accessible via 'python'. Details: ${err.message}`, 500));
    });

    pythonProcess.on('close', (code) => {

      if (code !== 0) {
        return reject(new AppError(`ML Engine Error (Code ${code}): ${errorData}`, 500));
      }

      try {
        // Extract strictly the JSON part
        const startIdx = result.indexOf('{');
        const endIdx = result.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = result.substring(startIdx, endIdx + 1);
          resolve(JSON.parse(jsonStr));
        } else {
          reject(new AppError("Invalid JSON structure from ML Engine. Output: " + result, 500));
        }
      } catch {
        reject(new AppError("Failed to parse JSON from ML Engine. Output: " + result, 500));
      }

    });

  });

};