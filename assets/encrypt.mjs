import "dotenv/config.js";
import { SHA256 } from 'crypto-es/lib/sha256.js'
import { AES } from 'crypto-es/lib/aes.js'

const checksum = SHA256(process.env.SECRET)
const ciphertext = AES.encrypt(process.env.ABLY_API_KEY, process.env.SECRET)

console.log('VITE_KEY_CHECKSUM=' + checksum.toString())
console.log('VITE_KEY_CIPHERTEXT='+ciphertext.toString())
