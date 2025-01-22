const regex = /^(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{4}))?$/;

const testStrings = [
  "46-16",   // Sẽ hợp lệ
  "9-2025",  // Sẽ hợp lệ
  "16-12-2025", // Sẽ hợp lệ
  "12/16",   // Sẽ hợp lệ
  "46-16-2025", // Sẽ hợp lệ
  "5-5",      // Sẽ hợp lệ
  "5/5/2025"  // Sẽ hợp lệ
];

testStrings.forEach(dateString => {
  const match = dateString.match(regex);
  console.log(`"${dateString}" match:`, match);
});
