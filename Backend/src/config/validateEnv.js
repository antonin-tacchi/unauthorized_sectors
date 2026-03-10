const REQUIRED = ["JWT_SECRET", "MONGO_URI", "PORT"];

const OPTIONAL_R2 = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n[STARTUP ERROR] Variables d'environnement manquantes :`);
    missing.forEach((key) => console.error(`  ✗ ${key}`));
    console.error(`\nCopie .env.example vers .env et remplis les valeurs requises.\n`);
    process.exit(1);
  }

  const missingR2 = OPTIONAL_R2.filter((key) => !process.env[key]);
  if (missingR2.length > 0) {
    console.warn(`[STARTUP WARN] Variables R2 absentes (upload 3D désactivé) :`);
    missingR2.forEach((key) => console.warn(`  ⚠ ${key}`));
  }
}
