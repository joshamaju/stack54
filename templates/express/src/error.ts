import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _, res, next) => {
  if (res.headersSent) return next(error);
  res.status(500).render("error", { error });
};
