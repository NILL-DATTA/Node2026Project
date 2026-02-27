function generateOTP() {
  // 6-digit random OTP generate
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = generateOTP;