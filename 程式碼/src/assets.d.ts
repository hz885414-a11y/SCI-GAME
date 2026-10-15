declare module "*.png" {
  const source: string;
  export default source;
}

declare module "*.webp" {
  const source: string;
  export default source;
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_CONFIG_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
interface ImportMetaEnv {
  readonly VITE_AMBIENT_DIALOGUES_PATH?: string;
}
