import Order from "../model/order.js";
import Product from "../model/product.js";
import BigPromise from "../middleware/BigPromise.js";
import CustomError from "../util/customError.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
dotenv.config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API,
  key_secret: process.env.RAZORPAY_SECRET,
});

export const creatOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const options = {
    amount: totalAmount * 100,
    currency: "INR",
    receipt: `order_${Date.now()}`,
    payment_capture: 1,
  };
  let order;
  try {
    const razorpayOrder = await razorpay.orders.create(options);

    order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo: razorpayOrder.id,
      taxAmount,
      shippingAmount,
      totalAmount,
      user: req.user._id,
    });
  } catch (error) {
    console.log(error);
  }
  res.status(200).json({
    message: "success",
    order,
    paymentInfo,
  });
});

export const updateOrderPayment = BigPromise(async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const paymentInfo = req.body.paymentInfo;

    // Update the order with payment information
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentInfo: paymentInfo },
      { new: true }
    );

    res.status(200).json({
      message: "Order payment information updated successfully",
      order: order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
      error: err,
    });
  }
});

export const getOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    return next(new CustomError("Please check orderId", 401));
  }

  res.status(200).json({
    message: "success",
    order,
  });
});
export const downloadInvice = BigPromise(async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    // Get the order and its associated user
    const order = await Order.findById(orderId).populate("user", "name email");

    // Create a new PDF document

    const doc = new PDFDocument();

    // Set the response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${orderId}.pdf"`
    );

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add the invoice header
    doc.fontSize(16).text("Invoice", { align: "center" });
    doc.text(`Invoice ID: ${orderId}`, { align: "center" });
    doc.moveDown();

    // Add the user information
    doc.fontSize(12).text(`Name: ${order.user.name}`);
    doc.fontSize(12).text(`Email: ${order.user.email}`);
    doc.moveDown();

    // Add the order information
    doc
      .fontSize(12)
      .text(`Order Date: ${new Date(order.createdAt).toDateString()}`);
    doc.fontSize(12).text(`Total Amount: ${order.totalAmount}`);
    doc.moveDown();

    // Add the order items
    doc.fontSize(12).text("Order Items:");
    doc.moveDown();
    order.orderItems.forEach((item, index) => {
      doc
        .fontSize(10)
        .text(`${index + 1}. ${item.name} - ${item.quantity} x ${item.price}`);
    });

    // Finalize the PDF and end the response
    doc.end();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
});

export const getLoggedInOders = BigPromise(async (req, res, next) => {
  const order = await Order.find({ user: req.user._id });

  if (!order) {
    return next(new CustomError("Please check orderId", 401));
  }

  res.status(200).json({
    message: "success",
    order,
  });
});

export const adminGetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();
  res.status(200).json({
    message: "success",
    orders,
  });
});
export const adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new CustomError("Please check orderId", 401));
  }

  if (order.orderStatus === "Delivered") {
    return next(new CustomError("Order is already marked for delivered", 401));
  }
  order.orderStatus = req.body.orderStatus;

  order.orderItems.forEach(async (product) => {
    await updateProductStock(product.product, product.quantity);
  });

  await order.save();

  res.status(200).json({
    message: "success",
    order,
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);
  product.stock = product.stock - quantity;
  product.save({ validateBeforeSave: false });
}

export const adminDeleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  await order.deleteOne();

  res.status(200).json({
    message: "success",
  });
});
