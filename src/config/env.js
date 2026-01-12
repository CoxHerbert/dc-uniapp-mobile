const baseUrl =
  process.env.VUE_APP_BASE_URL ||
  process.env.VUE_APP_API ||
  process.env.UNI_APP_API ||
  process.env.UNI_API_BASE ||
  '';

export { baseUrl };
