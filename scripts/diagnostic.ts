import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log("Razorpay Key ID configured:", !!keyId);
console.log("Razorpay Secret configured:", !!keySecret);
console.log("Test mode expected: true");

if (keyId && !keyId.startsWith("rzp_test_")) {
  console.log("WARNING: Key ID does not start with rzp_test_. It may be a live key.");
}
