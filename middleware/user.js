import User from "../model/user.js";
import BigPromise from "./BigPromise.js";
import CustomError from "../util/customError.js";
import jwt from "jsonwebtoken";

export const isLoggedIn = BigPromise(async (req, res, next) => {
  console.log("login req headers", req.header("Authorization"));
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
  console.log("token", token);
  if (!token) {
    return next(new CustomError("login first", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findOne({ _id: decoded.id });
  next();
});

export const customRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError("You are not allowed to see this resources", 402)
      );
    }
    next();
  };
};
