import CryptoJS from 'crypto-js';

export default class crypto {
  static cryptoKey = '2IoH5ZsTgNvUkggbFKgkralGDw79bmnM';
  static aesKey = 'OKdO5uepMjS7lPmY3xRkUohQN1QT3ltA';
  static desKey = 'ncO3gA7M7C57d1cD';

  static encrypt(data) {
    return this.encryptAES(data, this.aesKey);
  }

  static decrypt(data) {
    return this.decryptAES(data, this.aesKey);
  }

  static encryptAES(data, key) {
    const dataBytes = CryptoJS.enc.Utf8.parse(data);
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.AES.encrypt(dataBytes, keyBytes, {
      iv: keyBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  }

  static decryptAES(data, key) {
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.AES.decrypt(data, keyBytes, {
      iv: keyBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Utf8.stringify(decrypted);
  }

  static encryptDES(data, key) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.DES.encrypt(data, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  }

  static decryptDES(data, key) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.DES.decrypt(
      {
        ciphertext: CryptoJS.enc.Base64.parse(data),
      },
      keyHex,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
