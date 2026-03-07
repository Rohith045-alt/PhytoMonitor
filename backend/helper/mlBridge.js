const path = require('path');
const { spawn } = require('child_process');
const AppError = require('./AppError');

exports.predict = (imageBuffer) => {

  return new Promise((resolve, reject) => {

    const scriptPath = path.join(__dirname, '..', 'ml_models', 'predict.py');

    const pythonProcess = spawn('python', [scriptPath]);

    let result = "";
    let errorData = "";

    pythonProcess.stdin.write(imageBuffer);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      console.log("PYTHON STDOUT:", data.toString());
      result += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      console.error("PYTHON STDERR:", data.toString());
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {

      if (code !== 0) {
        return reject(new AppError(`ML Engine Error: ${errorData}`, 500));
      }

      try {
        const jsonStr = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
        resolve(JSON.parse(jsonStr || result));
      } catch {
        reject(new AppError("Invalid JSON from ML Engine. Output: " + result, 500));
      }

    });

  });

};