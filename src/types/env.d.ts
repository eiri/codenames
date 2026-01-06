interface ImportMetaEnv {
  readonly VITE_KEY_CIPHERTEXT: string;
  // add other VITE_ prefixed environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
