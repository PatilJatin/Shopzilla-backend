import User from "../model/user.js";
import BigPromise from "../middleware/BigPromise.js";
import CustomError from "../util/customError.js";
import cookieToken from "../util/cookieToken.js";
import fileUpload from "express-fileupload";
import cloudinary from "cloudinary";
import mailHelper from "../util/emailHelper.js";
import crypto from "crypto";

export const signup = BigPromise(async (req, res, next) => {
  if (!req.files) {
    return next(new CustomError("photo is required for signup", 400));
  }

  const { name, email, password } = req.body;

  if (!email) {
    return next(new CustomError("Email, Name and Password required", 400));
    // return next(new Error("Please send email"));
  }

  let file = req.files.photo;
  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result?.public_id,
      secure_url: result?.secure_url,
    },
  });

  cookieToken(user, res);
});

export const login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  //check for presence of email and password
  if (!email || !password) {
    return next(new CustomError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new CustomError("Email or Password does not match or exist", 400)
    );
  }

  const isPasswordCorrect = await user.isValidatedPassword(password);

  if (!isPasswordCorrect) {
    return next(
      new CustomError("Email or Password does not match or exist", 400)
    );
  }

  cookieToken(user, res);
});

export const logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  });
  res.status(200).json({
    message: "Logout success",
  });
});

export const forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new CustomError("Email not found", 400));
  }
  const forgotToken = await user.getForgotPasswordToken();
  ////////////////////////////////////////
  await user.save({ validateBeforeSave: false });
  ////////////////////////////////////////

  const resetUrl = `http://localhost:5173/password/reset/${forgotToken}`;
  const resetButton = `<a href="${resetUrl}" "style="background-color: #007bff; 
  color: #fff; 
  padding: 10px 20px; 
  text-decoration: none; 
  border-radius: 5px;">Reset Password</a>`;

  const message = `
    <p>Click the following button to reset your password:</p>
    ${resetButton}
  `;
  try {
    await mailHelper({
      email,
      subject: "ShopZilla - password reset email",
      message,
    });
    res.status(200).json({
      message: "email send successfully",
    });
  } catch (error) {
    user.forgotPasswardToken = undefined;
    user.forgotPasswardExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

export const passwordReset = BigPromise(async (req, res, next) => {
  const { token } = req.params;
  const ecryptToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswardToken: ecryptToken,
    forgotPasswardExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Token is invalid or expired", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError("Password and Confirm password do not match", 400)
    );
  }

  user.password = req.body.password;
  user.forgotPasswardToken = undefined;
  user.forgotPasswardExpiry = undefined;
  await user.save();

  cookieToken(user, res);
});
export const getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    message: "success",
    user,
  });
});

export const changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("+password");
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );
  if (!isCorrectOldPassword) {
    return next(new CustomError("old password incorrect", 400));
  }
  user.password = req.body.newPassword;
  await user.save();
  cookieToken(user, res);
});
export const updateUser = BigPromise(async (req, res, next) => {
  if (!req.body.email || !req.body.name) {
    return next(new CustomError("email and name fields are empty!", 400));
  }
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };
  if (req?.files?.photo) {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;
    const response = await cloudinary.v2.uploader.destroy(imageId);
    let file = req.files.photo;
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "users",
      width: 150,
      crop: "scale",
    });

    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    message: "sucess",
    user,
  });
});

export const adminAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    messgae: "success",
    users,
  });
});

export const mangerAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: "user" });
  res.status(200).json({
    messgae: "success",
    users,
  });
});

export const adminGetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError("User notFound", 404));
  }
  res.status(200).json({
    message: "success",
    user,
  });
});

export const adminUpdateOneUser = BigPromise(async (req, res, next) => {
  if (!req.body.email || !req.body.name) {
    return next(new CustomError("email and name fields are empty!", 400));
  }
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    message: "sucess",
    user,
  });
});

export const adminDeleteOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError("No such user found", 401));
  }
  const imageId = user.photo.id;
  await cloudinary.v2.uploader.destroy(imageId);
  await user.deleteOne();
  res.status(200).json({
    message: "success",
  });
});
