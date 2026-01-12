export async function uploadFile({ action, file, headers = {}, data = {}, fieldName = 'file' }) {
  if (!action) {
    throw new Error('上传地址未配置');
  }
  const formData = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  formData.append(fieldName, file, file?.name || file?.filename || 'file');

  const response = await fetch(action, {
    method: 'POST',
    headers: { ...headers },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `上传失败(${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  return payload;
}
