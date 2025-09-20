import {HelioSDK} from '@heliofi/sdk';

const HELIO_API_BASE = "https://api.dev.hel.io/v1";
// const HELIO_API_BASE = "https://api.hel.io/v1"; // For production
const HELIO_PUBLIC_KEY = process.env.HELIO_PUBLIC_KEY;
const HELIO_PRIVATE_KEY = process.env.HELIO_PRIVATE_KEY;
const WEBHOOK_REDIRECT_URL = process.env.WEBHOOK_REDIRECT_URL;


export const sdk = new HelioSDK({
  apiKey: HELIO_PUBLIC_KEY,
  secretKey: HELIO_PRIVATE_KEY,
  network: 'devnet', // or 'mainnet' (optional, mainnet by default)
});