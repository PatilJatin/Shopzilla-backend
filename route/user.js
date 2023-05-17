import express from "express";
import {
  signup,
  login,
  logout,
  forgotPassword,
  passwordReset,
  getLoggedInUserDetails,
  changePassword,
  updateUser,
  adminAllUser,
  mangerAllUser,
  adminGetOneUser,
  adminUpdateOneUser,
  adminDeleteOneUser,
} from "../controller/userController.js";
import { customRole, isLoggedIn } from "../middleware/user.js";

const router = express.Router();
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgotpassword").post(forgotPassword);
router.route("/password/reset/:token").post(passwordReset);
router.route("/userdashboard").get(isLoggedIn,getLoggedInUserDetails);
router.route("/changepassword").get(isLoggedIn, changePassword);
router.route("/userdashboard/update").post(isLoggedIn, updateUser);

router.route("/admin/users").get(isLoggedIn, customRole("admin"), adminAllUser);
router
  .route("/admin/user/:id")
  .get(isLoggedIn, customRole("admin"), adminGetOneUser)
  .put(isLoggedIn, customRole("admin"), adminUpdateOneUser)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneUser);
router
  .route("/manager/users")
  .get(isLoggedIn, customRole("manager"), mangerAllUser);

export default router;
