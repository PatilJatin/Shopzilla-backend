import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const productSchema = new mongoose.Schema({
  //     name
  // price
  // description
  // images[]
  // rating
  // category
  // company
  // stock
  // numOfReview
  // reviews[user,name,rating,comment]
  // user
  // createAt
  name: {
    type: String,
    required: [true, "please provide name for product"],
    trim: true,
    maxLength: [100, "Product should not be more than 100 characters"],
  },
  price: {
    type: Number,
    required: [true, "please provide price for product"],
    maxLength: [6, "Product price should not be more than 6 digits"],
  },
  description: {
    type: String,
    required: [true, "please provide description for product"],
    maxLength: [400, "Product price should not be more than 400 characters"],
  },
  images: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "please select category for product"],
    enum: {
      values: [
        "Mobile",
        "Laptop",
        "Computer",
        "Accessories",
        "Watch",
        "Cloths",
        "Headset",
      ],
      message:
        'Please select prove category from "Mobile","Laptop","Computer","Accessories","Watch" & "Cloths"',
    },
  },
  company: {
    type: String,
    required: [true, "Please add brand company for product"],
  },
  stock: {
    type: Number,
    required: [true, "Please provide add a number in stock"],
  },
  featured: {
    type: Boolean,
    required: true,
  },
  stars: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  colors: { type: [String], default: [] },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      stars: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Product", productSchema);
