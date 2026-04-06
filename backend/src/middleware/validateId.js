const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateId = (...paramNames) => {
    return (req, res, next) => {
        for (const paramName of paramNames) {
            const id = req.params[paramName];
            if (id && !UUID_REGEX.test(id)) {
                return res.status(400).json({ 
                    message: 'Invalid ID format',
                    param: paramName
                });
            }
        }
        next();
    };
};
