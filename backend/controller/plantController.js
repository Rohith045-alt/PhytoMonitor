const ML_BRIDGE = require("../helper/mlBridge");

exports.analyze = async (req, res, next) => {
  try {

    const prediction = await ML_BRIDGE.predict(req.files.image.data);

    res.status(200).json({
      status: "success",
      data: {
        ...prediction,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    next(err);
  }
};