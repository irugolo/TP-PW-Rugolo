import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
export default defineConfig([...next, {files:['supabase/functions/**/*.js'],languageOptions:{globals:{Deno:'readonly'}}}, globalIgnores(['.next/**','dist/**'])]);
