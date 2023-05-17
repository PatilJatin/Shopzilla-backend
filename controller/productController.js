import Product from "../model/product.js";
import BigPromise from "../middleware/BigPromise.js";
import CustomError from "../util/customError.js";
import cloudinary from "cloudinary";
import WhereClause from "../util/whereClause.js";

export const addProduct = BigPromise(async (req, res, next) => {
  let imageArray = [];
  if (!req.files) {
    return next(new CustomError("Product images are required", 401));
  }
  if (req.files) {
    for (let index = 0; index < req.files.images.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.images[index].tempFilePath,
        {
          folder: "products",
        }
      );
      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }
  const colors = req.body.colors.split(",");
  req.body.images = imageArray;
  req.body.user = req.user.id;
  req.body.colors = colors;
  const product = await Product.create(req.body);
  res.status(200).json({
    message: "success",
    product,
  });
});

export const getAllProduct = BigPromise(async (req, res, next) => {
  const resultPerPage = 300;
  const totalProductCount = await Product.countDocuments();
  const productObject = new WhereClause(Product.find(), req.query)
    .search()
    .filter();
  let products = await productObject.base;
  const filteredProductNumber = products.length;

  productObject.pager(resultPerPage);
  products = await productObject.base.clone();

  res.status(200).json({
    message: "success",
    totalProductCount,
    filteredProductNumber,
    products,
  });
});

export const getOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError("There is no such product of this Id", 404));
  }
  res.status(200).json({
    message: "Success",
    product,
  });
});

export const adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError("There is no such product of this Id", 404));
  }

  let imageArray = [];
  if (req.files) {
    for (let index = 0; index < product.images.length; index++) {
      await cloudinary.v2.uploader.destroy(product.images[index].id);
    }
    for (let index = 0; index < req.files.images.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.images[index].tempFilePath,
        {
          folder: "products",
        }
      );
      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }
  req.body.images = imageArray;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    message: "Success",
    product,
  });
});

export const adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError("There is no such product of this Id", 404));
  }

  for (let index = 0; index < product.images.length; index++) {
    await cloudinary.v2.uploader.destroy(product.images[index].id);
  }

  await product.deleteOne();
  res.status(200).json({
    message: "Success",
  });
});

export const addReview = BigPromise(async (req, res, next) => {
  const { stars, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    stars: Number(stars),
    comment,
  };

  const product = await Product.findById(productId);

  const alreadyReview = product.reviews.find((review) => {
    return review.user.toString() === req.user._id.toString();
  });
  if (alreadyReview) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.stars = stars;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  product.stars =
    product.reviews.reduce((acc, item) => item.stars + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "success",
    product,
  });
});

export const deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;

  const product = await Product.findById(productId);

  const reviews = product.reviews.filter(
    (review) => review.user.toString() !== req.user._id.toString()
  );

  const numberOfReviews = reviews.length;

  let stars =
    product.reviews.reduce((acc, item) => item.stars + acc, 0) /
    product.reviews.length;

  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      stars,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    message: "success",
    product,
  });
});

export const getReviews = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.query.id);
  res.status(200).json({
    message: "sucess",
    reviews: product.reviews,
  });
});
