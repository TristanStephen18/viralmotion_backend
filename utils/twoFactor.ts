import speakeasy from "speakeasy";
import QRCode from "qrcode";

export const generateTwoFactorSecret = (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `ViralMotion (${email})`,
    issuer: "ViralMotion",
    length: 32,
  });
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  return QRCode.toDataURL(otpauthUrl);
};

export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow ±30 seconds
  });
};