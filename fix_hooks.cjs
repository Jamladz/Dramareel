const fs = require('fs');
let code = fs.readFileSync('src/components/PointsStoreModal.tsx', 'utf8');

// We need to move the 'if (!isOpen) return null;' statement.
// Currently it's at:
//   };
//
//   if (!isOpen) return null;
//
//   const selectedPkg = ...

// And the hooks are currently lower down:
//   const [isRewardAdLoading, setIsRewardAdLoading] = useState(false);
//   const [adsWatchedCount, setAdsWatchedCount] = useState(0);
//   const DAILY_AD_LIMIT = 20;
//
//   React.useEffect(() => {

// Let's remove the first occurrence of `if (!isOpen) return null;`
code = code.replace("  if (!isOpen) return null;", "");

// And re-insert it right before `const selectedPkg = POINTS_VIP_PACKAGES`
code = code.replace(
  "  const selectedPkg = POINTS_VIP_PACKAGES.find(p => p.id === selectedPkgId) || POINTS_VIP_PACKAGES[0];",
  "  if (!isOpen) return null;\n\n  const selectedPkg = POINTS_VIP_PACKAGES.find(p => p.id === selectedPkgId) || POINTS_VIP_PACKAGES[0];"
);

fs.writeFileSync('src/components/PointsStoreModal.tsx', code);
console.log('Fixed PointsStoreModal hooks order');
