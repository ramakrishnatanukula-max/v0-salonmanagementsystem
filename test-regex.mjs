// Test mobile validation
const regex = /^\+?\d{7,15}$/;

const testNumbers = [
  "6303012453",      // 10 digits
  "+918999997877",   // + followed by 12 digits
  "+918999997877",   // + followed by 12 digits
  "7670826262",      // 10 digits
  "8106479111",      // 10 digits
  "+91",             // Too short
  "abc1234567",      // Invalid chars
];

testNumbers.forEach(num => {
  const isValid = regex.test(num);
  console.log(`"${num}" => ${isValid ? "✓ VALID" : "✗ INVALID"}`);
});
