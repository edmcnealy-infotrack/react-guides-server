const logger = require('../logs/logger');
const genericError = 'There was a problem with your request, please try again.';

/**
 * Send an error response back to the client and log it.
 * @param req The original request object, used for getting the url
 * @param res The response object, used for returning to the client
 * @param message The error message. This needs to be a friendly error message, since it will be sent back to the client and displayed to the user
 * @param statusCode The status code to use in the response back to the client
 * @param exception Any exception message. This can be from a try-catch, or just a generic exception message. This does not need to be friendly, since it will not be sent to the client
 */
function handleError(req, res, message, statusCode, exception) {
  statusCode = statusCode || 400;
  // Log the exception to the server, if it exists
  let exceptionMessage = exception ? `\n${exception}` : '';
  let log = `\nRequest url: ${req.url} - Status Code: ${statusCode}\nMessage: ${message}${exceptionMessage}`;
  logger.error(log);

  // Send the client back an error message
  let errorData = { message: message };
  res.setHeader('content-type', 'application/json');
  return res.status(statusCode).send(JSON.stringify(errorData));
}

/**
 * Handles the standard response to the client app.
 * @param {*} req The original request object
 * @param {*} res The response object used for sending back to the client
 * @param {*} data The data to send back to the client in the response body
 */
function handleSuccess(req, res, data) {
  let response = {
    data: data
  };
  res.setHeader('content-type', 'application/json');
  let responseString = JSON.stringify(response);
  return res.status(200).send(responseString);
}

/**
 * Handles the server response from mcnedward.com.
 * @param {*} err The error, or null if none
 * @param {*} response The response from the server request
 * @param {*} body The body of the response
 * @param {*} req The original request object
 * @param {*} req The response object used for sending back to the client
 */
function handleServerResponse(err, response, body, req, res) {
  if (err) {
    handleError(req, res, genericError, 400, err);
  } else {
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      data = {};
    }
    if (response.statusCode === 200) {
      // TODO Use the handle success here
      res.setHeader('Content-Type', 'application/json');
      let responseData = JSON.stringify(data.entity);
      return res.status(200).send(responseData);
    } else {
      // Build the error message
      var message = data.errors && data.errors.length > 0 ? data.errors[0] : 'Something went wrong with your request...';
      handleError(req, res, message, response.statusCode);
    }
  }
}

module.exports = {
  handleServerResponse: handleServerResponse,
  successResponse: handleSuccess,
  errorResponse: handleError
}