function successResponse(res, status, message, payload = {}) {
  return res.status(status).json({
    status,
    statusState: "success",
    message,
    ...payload, 
  });
}

module.exports = { successResponse };