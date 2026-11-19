// 404 Not Found Middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Robust Central Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier format: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    message = `An entry with this ${field} already exists. Please use a unique value.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle JWT Verification Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Session token is invalid or corrupted. Please sign in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session has expired. Please sign in again.';
  }

  // Handle Express Malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload sent in request body.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { notFound, errorHandler };
