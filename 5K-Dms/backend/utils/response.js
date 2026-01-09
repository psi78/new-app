export const successResponse = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

export const errorResponse = (res, message = "An error occurred", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  })
}

export const validationErrorResponse = (res, errors, message = "Validation failed") => {
  return res.status(400).json({
    success: false,
    message,
    errors,
  })
}

