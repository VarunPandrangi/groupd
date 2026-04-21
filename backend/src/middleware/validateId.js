import mongoose from 'mongoose';

import { errorResponse } from '../utils/apiResponse.js';

export const validateId = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];

      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid ID format', 'INVALID_ID', 400, {
          param: paramName,
        });
      }
    }

    return next();
  };
};