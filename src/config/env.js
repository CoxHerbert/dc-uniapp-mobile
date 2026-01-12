const resolveBaseUrl = () => {
  const env = process.env.VUE_APP_ENV || process.env.NODE_ENV || '';
  const envKey = env ? `VUE_APP_BASE_URL_${env.toUpperCase()}` : '';
  return (
    (envKey && process.env[envKey]) ||
    process.env.VUE_APP_BASE_URL ||
    process.env.VUE_APP_API ||
    process.env.UNI_APP_API ||
    process.env.UNI_API_BASE ||
    ''
  );
};

const baseUrl = resolveBaseUrl();

export { baseUrl };
