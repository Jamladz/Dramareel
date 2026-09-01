const fs = require('fs');
let code = fs.readFileSync('src/services/userService.ts', 'utf8');

code = code.replace(
  "export async function claimMonetagReward(userId: string): Promise<{ success: boolean; newTotal?: number; lastClaim?: number; remainingMs?: number; error?: string }> {\n  try {\n    if (!userId) return { success: false, error: 'Invalid data' };\n    const userRef = doc(db, 'users', userId);\n    \n    const REWARD = 100;",
  "export async function claimMonetagReward(userId: string): Promise<{ success: boolean; newTotal?: number; lastClaim?: number; remainingMs?: number; error?: string }> {\n  try {\n    if (!userId) return { success: false, error: 'Invalid data' };\n    const userRef = doc(db, 'users', userId);\n    \n    const REWARD = 30;"
);

code = code.replace(
  "export async function claimSiteVisitReward(userId: string): Promise<{ success: boolean; newTotal?: number; lastClaim?: number; remainingMs?: number; error?: string }> {\n  try {\n    if (!userId) return { success: false, error: 'Invalid data' };\n    const userRef = doc(db, 'users', userId);\n    \n    const REWARD = 50;",
  "export async function claimSiteVisitReward(userId: string): Promise<{ success: boolean; newTotal?: number; lastClaim?: number; remainingMs?: number; error?: string }> {\n  try {\n    if (!userId) return { success: false, error: 'Invalid data' };\n    const userRef = doc(db, 'users', userId);\n    \n    const REWARD = 20;"
);

fs.writeFileSync('src/services/userService.ts', code);
console.log('patched userService.ts rewards');
