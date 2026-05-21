export function createRandomString(length = 32): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}
