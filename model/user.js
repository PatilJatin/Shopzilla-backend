import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name"],
    maxLength: [50, "Name shoulb be under 50 Characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide the email"],
    validate: [validator.isEmail, "Please enter Email in correct format"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide the password"],
    minLength: [8, "password should be atleast 8 character"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
      required: true,
    },
    secure_url: {
      type: String,
      default:
        "https://eliaslealblog.files.wordpress.com/2014/03/user-200.png?w=700",
      required: true,
    },
  },
  forgotPasswardToken: String,
  forgotPasswardExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//encrypt password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//validate the password with passedon user password
userSchema.methods.isValidatedPassword = async function (userSendPasswrord) {
  return await bcrypt.compare(userSendPasswrord, this.password);
};

//create and return JWT token
userSchema.methods.getToken = async function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY,
    }
  );
};

//genearte forgot passoword token
userSchema.methods.getForgotPasswordToken = async function () {
  //generate a long and random string
  const forgotToken = crypto.randomBytes(20).toString("hex");
  //getting a hash - make sure hash on backend as well
  this.forgotPasswardToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  //time of token
  this.forgotPasswardExpiry = Date.now() + 20 * 60 * 1000;

  return forgotToken;
};

export default mongoose.model("User", userSchema);
