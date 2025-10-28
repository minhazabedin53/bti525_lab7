export function ok(res, data = {}, code = 200, headers = {}) {
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  return res.status(code).json({ status: 'ok', ...data });
}

export function fail(res, code = 500, message = 'internal server error') {
  return res.status(code).json({
    status: 'error',
    error: { code, message },
  });
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);