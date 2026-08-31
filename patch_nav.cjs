const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

code = code.replace(
  "import { Home, Flame, Heart, PlayCircle, User } from 'lucide-react';",
  "import { Home, Gift, Heart, PlayCircle, User } from 'lucide-react';"
);

code = code.replace(
  "{ to: \"/foryou\", icon: <Flame size={22} />, label: t('forYou', 'For You') },",
  "{ to: \"/tasks\", icon: <Gift size={22} />, label: t('tasks', 'المهام') },"
);

fs.writeFileSync('src/components/BottomNav.tsx', code);
console.log('patched BottomNav.tsx');
