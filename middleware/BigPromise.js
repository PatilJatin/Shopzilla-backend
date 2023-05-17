//try-cath || acsych-await || promise

export default (func) => (req, res, next) =>
  Promise.resolve(func(req, res, next)).catch(next);
