import nodemailer from "nodemailer";

const mailHelper = async (options) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const message = {
    from: "jatinpatil8000@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: `<a href="">Reset password<a/>`
  };
  await transporter.sendMail(message);
};

export default mailHelper;
