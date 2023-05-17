import express from "express";
import { customRole, isLoggedIn } from "../middleware/user.js";
import {
  addProduct,
  addReview,
  adminDeleteOneProduct,
  adminUpdateOneProduct,
  deleteReview,
  getAllProduct,
  getOneProduct,
  getReviews,
} from "../controller/productController.js";

const router = express.Router();
//user route
router.route("/getAllProducts").get( getAllProduct);
router.route("/product/:id").get( getOneProduct);
router
  .route("/review")
  .put(isLoggedIn, addReview)
  .delete(isLoggedIn, deleteReview)
  .get(isLoggedIn, getReviews);

//admin route
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);
router
  .route("/admin/product/update/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);
export default router;
