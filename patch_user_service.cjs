const fs = require('fs');
let code = fs.readFileSync('src/services/userService.ts', 'utf8');

if (!code.includes('getUserData(userId')) {
  const newFunc = `
export async function getUserData(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}
`;
  code += newFunc;
  fs.writeFileSync('src/services/userService.ts', code);
  console.log('patched userService.ts');
}
