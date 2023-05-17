import {
  adminDeleteOrder,
  adminGetAllOrders,
  adminUpdateOrder,
  creatOrder,
  getLoggedInOders,
  getOneOrder,
  updateOrderPayment,
  downloadInvice,
} from "../controller/orderController.js";
import { isLoggedIn, customRole } from "../middleware/user.js";
import express from "express";
const router = express.Router();

router.route("/create/order").post(isLoggedIn, creatOrder);
router.route("/order_details/:id").get(isLoggedIn, getOneOrder);
router.route("/myorder").get(isLoggedIn, getLoggedInOders);
router.route("/orders/:orderId").put(isLoggedIn, updateOrderPayment);
router.route('/orders/:orderId/invoice').get(isLoggedIn, downloadInvice)

router
  .route("/admin/getAllOrder")
  .get(isLoggedIn, customRole("admin"), adminGetAllOrders);
router
  .route("/admin/order/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOrder)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOrder);

export default router;
