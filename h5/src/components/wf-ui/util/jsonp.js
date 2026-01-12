export default function(url, callbackName = 'QQmap') {
	return new Promise((resolve, reject) => {
		let scriptNode = document.createElement('script');
		scriptNode.src = url;
		// callback
		window[callbackName] = (result) => {
			result ? resolve(result) : reject('没有返回数据');
			delete window[callbackName];
			document.body.removeChild(scriptNode);
		}
		// 异常情况
		scriptNode.addEventListener('error', () => {
			reject('接口返回数据失败');
			delete window[callbackName];
			document.body.removeChild(scriptNode);
		}, false)
		// 开始请求
		document.body.appendChild(scriptNode)
	})
}
