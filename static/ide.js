// fonctions de communication avec le serveur
function connexion() {
	const ajax = new XMLHttpRequest()
	ajax.onreadystatechange = () => {
		if (ajax.readyState === 4 && ajax.status === 200) {
			const data = JSON.parse(ajax.responseText)
			fld_barre_outils.disabled = false
			lbl_nom_prenom.innerText = data.nom_prenom
			ace_editeur.setReadOnly(false)
		}
	}
	ajax.open('POST', '?action=connexion')
	ajax.send()
}

function deconnexion() {
	const ajax = new XMLHttpRequest()
	ajax.open('POST', '?action=deconnexion')
	ajax.send()
}

function envoi_code() {
	const ajax = new XMLHttpRequest()
	ajax.open('POST', '?action=envoi_code')
	ajax.setRequestHeader('Content-Type', 'application/json')
	ajax.send(JSON.stringify({
		code: ace_editeur.getValue(),
		console: txt_console.innerText
	}))
}

function demande_revue() {
	const ajax = new XMLHttpRequest()
	ajax.open('POST', '?action=demande_revue')
	ajax.send()
}



// variables globales à l'application
let ref_fichier = null
let ignorer_prochaine_modification = false
let envoi_automatique = true



// obtention de l'identifiant de l'apprenant et téléchargement des données
let identifiant = (document.cookie.split('; ').find(kv => kv.startsWith('identifiant=')) || 'identifiant=').slice('identifiant='.length)
if (identifiant === '') {
	identifiant = prompt('Veuillez renseigner votre identifiant pour accéder à ce salon') || ''
	document.cookie = `identifiant=${identifiant}`
}
onpageshow = connexion
onpagehide = deconnexion



// initialisation de l'éditeur de texte
ace.config.set('basePath', 'https://pagecdn.io/lib/ace/1.4.12/')
const ace_editeur = ace.edit('txt_editeur', {
	mode: 'ace/mode/python',
	readOnly: true,
	tabSize: JSON.parse(localStorage.getItem('ace_tabSize') || '4'),
	theme: localStorage.getItem('ace_theme') || 'ace/theme/xcode',
	useSoftTabs: JSON.parse(localStorage.getItem('ace_useSoftTabs') || 'true'),
})
ace_editeur.session.on('change', () => {
	if (ignorer_prochaine_modification) {
		ignorer_prochaine_modification = false
	} else {
		lbl_indicateur_modifie.style.visibility = 'visible'
	}
})



// initialisation du séparateur mobile entre panneaux gauche et droite
Split(['#panneau_gauche', '#panneau_droite'], {
	sizes: JSON.parse(localStorage.getItem('split_sizes') || '[50,50]'),
	gutterSize: 4,
	snapOffset: 0,
	elementStyle: (_, s, g) => ({'flex-basis': `calc(${s}% - ${g}px)`}),
	gutterStyle: (_, g) => ({'flex-basis': `${g}px`}),
	onDragEnd: (s) => localStorage.setItem('split_sizes', JSON.stringify(s)),
})



// gestion des onglets du panneau de droite
function selection_onglet(onglet, volet) {
	spn_console.classList.remove('onglet_actif')
	spn_chat.classList.remove('onglet_actif')
	onglet.classList.add('onglet_actif')
	txt_console.style.display = 'none'
	div_chat.style.display = 'none'
	volet.style.display = null
	localStorage.setItem('onglet_actif', onglet.id)
	localStorage.setItem('volet_actif', volet.id)
}
selection_onglet(
	document.getElementById(localStorage.getItem('onglet_actif') || 'spn_console'),
	document.getElementById(localStorage.getItem('volet_actif') || 'txt_console')
)



// initialisation de l'interpréteur Python dans un thread distinct
txt_console.value += "Chargement de l'interpréteur Python..."
const pyodide_worker = new Worker('./static/webworker.js')
pyodide_worker.onerror = (e) => {
	console.log(`Error in pyodide_worker at ${e.filename}, line ${e.lineno}: ${e.message}`)
}
pyodide_worker.onmessage = (e) => {
	btn_executer.disabled = false
	txt_console.value += e.data
}



// initialisation des raccourcis clavier
onkeydown = (e) => {
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



// définition des callbacks
btn_nouveau.onclick = async () => {
	ref_fichier = await showSaveFilePicker()
	let file_name = ref_fichier.name
	lbl_nom_fichier.textContent = file_name
	ace_editeur.session.setMode(ace_modelist.getModeForPath(file_name).mode)
	lbl_indicateur_modifie.style.visibility = 'hidden'
	ignorer_prochaine_modification = true
	ace_editeur.session.setValue('')
}

btn_ouvrir.onclick = async () => {
	ref_fichier = (await showOpenFilePicker())[0]
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
		ref_fichier = await showSaveFilePicker()
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
	ref_fichier = await showSaveFilePicker()
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
