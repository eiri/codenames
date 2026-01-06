interface ImportMetaEnv {
  readonly ABLY_API_KEY: string;
  readonly SECRET: string;
  readonly VITE_KEY_CHECKSUM: string;
  readonly VITE_KEY_CIPHERTEXT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
