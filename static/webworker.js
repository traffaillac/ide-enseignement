importScripts('./pyodide.js')

languagePluginLoader.then(() => {
	postMessage(' OK\n')
	pyodide.runPython(`
		def _print_decorator(f):
			import sys, io
			from js import self
			def new_print(*args, **kwargs):
				sys.stdout = io.StringIO()
				f(*args, **kwargs)
				self.postMessage(sys.stdout.getvalue())
			return new_print
		print = _print_decorator(print)`)
})

onmessage = async function(e) {
	const code = e.data
	for (const mod of ['matplotlib', 'networkx', 'numpy', 'pandas', 'scipy']) {
		if (code.includes(mod) && !(mod in pyodide.loadedPackages)) {
			postMessage(`Chargement du module ${mod}...`)
			await pyodide.loadPackage(mod)
			postMessage(' OK\n')
		}
	}
	try {
		pyodide.runPython(code)
	} catch (error) {
		postMessage(error)
	}
}
