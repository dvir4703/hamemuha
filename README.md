# hamemuha

AI-powered quiz application

## החידון והחוויה

אפליקציית Windows שולחנית לניהול, יצירה והפעלת חידונים אינטראקטיביים בלייב מול קהל. הפרויקט בנוי עם Electron, React 18, TypeScript, Vite ו-SQLite, ומפותח על macOS לקראת הפצה ב-Windows.

### דרישות מערכת

- Node.js 20.19 ומעלה (מומלץ להשתמש בגרסת LTS עדכנית)
- pnpm 9 ומעלה
- macOS, Windows או Linux לפיתוח; יעד ההפצה הראשי הוא Windows

### התקנה

```bash
pnpm install
```

### הרצה בפיתוח

```bash
pnpm dev
```

הפקודה מפעילה את Vite עם hot reload ופותחת את חלון Electron.

### Build ל-Windows

```bash
pnpm build:win
```

הפקודה בונה את ה-renderer ואת תהליכי Electron, ולאחר מכן מפיקה מתקין NSIS ל-Windows x64 בתיקיית `dist`. בנייה מ-macOS עשויה להוריד כלי cross-build נוספים בפעם הראשונה.

### פקודות נוספות

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

מסד הנתונים המקומי נוצר אוטומטית בתיקיית `userData` של Electron בהרצה הראשונה.
