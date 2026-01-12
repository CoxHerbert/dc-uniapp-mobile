import { sm2 } from 'sm-crypto';
import website from '@/config/website';

export function encryptPassword(value) {
  if (!value) return value;
  const publicKey = website?.oauth2?.publicKey;
  if (!publicKey) return value;
  return sm2.doEncrypt(String(value), publicKey, 0);
}
