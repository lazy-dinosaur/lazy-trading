// 제안: 더 안전한 암호화 방식 사용
export const encryptApiKey = async (apiKey: string, pin: string) => {
  // PIN으로부터 암호화 키 생성
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  // 솔트 생성
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 키 생성
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  // 암호화
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(apiKey),
  );

  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv),
    salt: Array.from(salt),
  };
};

export const saveEncryptedKey = async (
  accountId: string,
  encryptedApiKey: ReturnType<typeof encryptApiKey>,
  encryptedSecretKey: ReturnType<typeof encryptApiKey>,
) => {
  try {
    await chrome.storage.local.set({
      [`encrypted_${accountId}`]: {
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to save encrypted keys:", error);
    return false;
  }
};

// 암호화된 키를 크롬 스토리지에서 불러오기
export const loadEncryptedKey = async (accountId: string) => {
  try {
    const result = await chrome.storage.local.get([`encrypted_${accountId}`]);
    return result[`encrypted_${accountId}`] || null;
  } catch (error) {
    console.error("Failed to load encrypted keys:", error);
    return null;
  }
};

// 저장된 암호화 키 삭제
export const deleteEncryptedKey = async (accountId: string) => {
  try {
    await chrome.storage.local.remove([`encrypted_${accountId}`]);
    return true;
  } catch (error) {
    console.error("Failed to delete encrypted keys:", error);
    return false;
  }
};

export const decryptApiKey = async (
  encryptedData: {
    encrypted: number[];
    iv: number[];
    salt: number[];
  },
  pin: string,
) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(encryptedData.salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) },
    key,
    new Uint8Array(encryptedData.encrypted),
  );

  return new TextDecoder().decode(decrypted);
};
