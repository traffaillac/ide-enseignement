// initialisations spécifiques à l'application
const ajax = new XMLHttpRequest()
const protocole = {
	user: 'Thibault',
	filename: null,
	timestamp: 0,
	code: null
}
let ref_fichier = null
let ignorer_prochaine_modification = false

// initialisation de l'éditeur de texte
ace.config.set('basePath', 'https://pagecdn.io/lib/ace/1.4.12/')
const ace_modelist = ace.require('ace/ext/modelist')
const ace_editeur = ace.edit('txt_editeur')
//ace_editeur.setTheme('ace/theme/mariana')
ace_editeur.session.on('change', () => {
	if (ignorer_prochaine_modification) {
		ignorer_prochaine_modification = false
	} else {
		lbl_indicateur_modifie.style.visibility = 'visible'
	}
})

// initialisation du séparateur mobile entre panneaux gauche et droite
Split(['#txt_editeur', '#txt_console'], {
	elementStyle: (_, s, g) => ({'flex-basis': `calc(${s}% - ${g}px)`}),
	gutterStyle: (_, g) => ({'flex-basis': `${g}px`}),
	gutterSize: 4,
	snapOffset: 0,
})

// initialisation de l'interpréteur Python dans un thread distinct
txt_console.value += "Chargement de l'interpréteur Python..."
const pyodide_worker = new Worker('./webworker.js')
pyodide_worker.onerror = (e) => {
	console.log(`Error in pyodide_worker at ${e.filename}, line ${e.lineno}: ${e.message}`)
}
pyodide_worker.onmessage = (e) => {
	btn_executer.disabled = false
	txt_console.value += e.data
}



// initialisation des fonctions et callbacks
async function envoi_code() {
	protocole.filename = ref_fichier.name
	protocole.timestamp = Date.now()
	protocole.code = ace_editeur.getValue()
	ajax.open('POST', 'protocole', false)
	ajax.setRequestHeader('Content-Type', 'application/json')
	ajax.send(JSON.stringify(protocole))
}

btn_nouveau.onclick = async () => {
	ref_fichier = await window.showSaveFilePicker()
	let file_name = ref_fichier.name
	lbl_nom_fichier.textContent = file_name
	ace_editeur.session.setMode(ace_modelist.getModeForPath(file_name).mode)
	lbl_indicateur_modifie.style.visibility = 'hidden'
	ignorer_prochaine_modification = true
	ace_editeur.session.setValue('')
}

btn_ouvrir.onclick = async () => {
	ref_fichier = (await window.showOpenFilePicker())[0]
	let file_name = ref_fichier.name
	lbl_nom_fichier.textContent = file_name
	ace_editeur.session.setMode(ace_modelist.getModeForPath(file_name).mode)
	const file = await ref_fichier.getFile()
	lbl_indicateur_modifie.style.visibility = 'hidden'
	ignorer_prochaine_modification = true
	ace_editeur.setValue(await file.text())
	envoi_code()
}

btn_enregistrer.onclick = async () => {
	if (ref_fichier === null) {
		ref_fichier = await window.showSaveFilePicker()
		let file_name = ref_fichier.name
		lbl_nom_fichier.textContent = file_name
		ace_editeur.session.setMode(ace_modelist.getModeForPath(file_name).mode)
	}
	const writable = await ref_fichier.createWritable()
	await writable.write(ace_editeur.getValue())
	await writable.close()
	lbl_indicateur_modifie.style.visibility = 'hidden'
	envoi_code()
}

btn_enregistrer_sous.onclick = async () => {
	ref_fichier = await window.showSaveFilePicker()
	let file_name = ref_fichier.name
	lbl_nom_fichier.textContent = file_name
	ace_editeur.session.setMode(ace_modelist.getModeForPath(file_name).mode)
	const writable = await ref_fichier.createWritable()
	await writable.write(ace_editeur.getValue())
	await writable.close()
	lbl_indicateur_modifie.style.visibility = 'hidden'
}

btn_executer.onclick = async () => {
	pyodide_worker.postMessage(ace_editeur.getValue())
}



// initialisation des raccourcis clavier
window.onkeydown = (e) => {
	if (!e.ctrlKey && !e.metaKey)
		return
	if (e.code === 'KeyN') {
		e.preventDefault()
		btn_nouveau.click()
	}
	if (e.code === 'KeyO') {
		e.preventDefault()
		btn_ouvrir.click()
	}
	if (e.code === 'KeyS') {
		e.preventDefault()
		btn_enregistrer.click()
	}
	if (e.shiftKey && e.code === 'KeyS') {
		e.preventDefault()
		btn_enregistrer_sous.click()
	}
}
