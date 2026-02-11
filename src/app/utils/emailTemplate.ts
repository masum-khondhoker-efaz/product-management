const getVerificationEmailTemplate = (fullName: string, otp: number) => `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
  <table width="100%" style="border-collapse: collapse;">
    <tr>
      <td style="background-color: #8FAF9A; padding: 20px; text-align: center; color: #000000; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">Verify your email</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <p style="font-size: 16px; margin: 0;">Hello <strong>${fullName}</strong>,</p>
        <p style="font-size: 16px;">Please verify your email.</p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 18px;">Your OTP is: <span style="font-weight:bold">${otp}</span><br/> This OTP will expire in 5 minutes.</p>
        </div>
        <p style="font-size: 14px; color: #555;">If you did not request this change, please ignore this email.</p>
        <p style="font-size: 16px; margin-top: 20px;">Thank you,<br>Mini E-commerce Team</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 10px 10px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Mini E-commerce Marketplace. All rights reserved.</p>
      </td>
    </tr>
  </table>
</div>
`;

const forgetPasswordEmailTemplate = (fullName: string, otp: number) =>
  `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <table width="100%" style="border-collapse: collapse;">
        <tr>
          <td style="background-color: #8FAF9A; padding: 20px; text-align: center; color: #fff; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">Reset Password OTP</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <p style="font-size: 16px; margin: 0;">Hello <strong>${fullName}</strong>,</p>
            <p style="font-size: 16px;">Please verify your email to reset your password.</p>
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 18px;">Your OTP is: <span style="font-weight:bold">${otp}</span><br/>This OTP will expire in 5 minutes.</p>
            </div>
            <p style="font-size: 14px; color: #555;">If you did not request this change, please ignore this email. No further action is needed.</p>
            <p style="font-size: 16px; margin-top: 20px;">Thank you,<br>Mini E-commerce</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Mini E-commerce Team. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

export const emailTemplates = {
  getVerificationEmailTemplate,
  forgetPasswordEmailTemplate,
};
