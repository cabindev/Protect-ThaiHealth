// ESLint (flat config) ตามคู่มือ Next 16 — `next lint` ถูกถอดแล้ว ใช้ `npm run lint` (= eslint .)
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      // ขึ้นต้นด้วย _ = ตั้งใจไม่ใช้ (คงลายเซ็นฟังก์ชันไว้)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
    },
  },
  // server.js = CommonJS ที่ Passenger (Plesk) โหลดตรง ๆ
  { files: ['server.js'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'uploads/**', 'backups/**']),
]);
