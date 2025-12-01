import crypto from "crypto";

export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

export const generateEmailVerificationToken = () => {
  return generateToken(32);
};

export const generatePasswordResetToken = () => {
  return generateToken(32);
};
