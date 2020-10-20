// variables globales à l'application
const ajax = new XMLHttpRequest()
let ref_fichier = null
let ignorer_prochaine_modification = false
const parametres = {
	position_separateur: '50%',
	theme_editeur: 'xcode',
	tabulation: '    ',
	envoi_automatique: true,
}



// initialisation de l'éditeur de texte
ace.config.set('basePath', 'https://pagecdn.io/lib/ace/1.4.12/')
const ace_editeur = ace.edit('txt_editeur', {
	mode: 'ace/mode/python',
	readOnly: true})
//ace_editeur.setTheme('ace/theme/mariana')
ace_editeur.session.on('change', () => {
	if (ignorer_prochaine_modification) {
		ignorer_prochaine_modification = false
	} else {
		lbl_indicateur_modifie.style.visibility = 'visible'
	}
})



// initialisation du séparateur mobile entre panneaux gauche et droite
Split(['#panneau_gauche', '#panneau_droite'], {
	elementStyle: (_, s, g) => ({'flex-basis': `calc(${s}% - ${g}px)`}),
	gutterStyle: (_, g) => ({'flex-basis': `${g}px`}),
	gutterSize: 4,
	snapOffset: 0,
})



// gestion des onglets du panneau de droite
function selection_onglet(onglet, volet) {
	spn_console.classList.remove('onglet_actif')
	spn_chat.classList.remove('onglet_actif')
	onglet.classList.add('onglet_actif')
	txt_console.style.display = 'none'
	div_chat.style.display = 'none'
	volet.style.display = null
}
selection_onglet(spn_console, txt_console)



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



// obtention de l'identifiant de l'apprenant et téléchargement des données
let identifiant = (document.cookie.split('; ').find(kv => kv.startsWith('identifiant=')) || 'identifiant=').slice('identifiant='.length)
if (identifiant === '') {
	identifiant = prompt('Veuillez renseigner votre identifiant pour accéder à ce salon') || ''
	document.cookie = `identifiant=${identifiant}`
}
ajax.open('GET', `?tache=initialisation`, false)
ajax.send()
if (ajax.status === 200) {
	const data = JSON.parse(ajax.responseText)
	lbl_nom_prenom.innerText = data.nom_prenom
	Object.assign(parametres, data.parametres_ide)
	ace_editeur.setTheme(`ace/theme/${parametres.theme_editeur}`)
	ace_editeur.session.setTabSize(parametres.taille_tabulations)
	ace_editeur.session.setUseSoftTabs(parametres.tabulation_par_espaces)
	ace_editeur.setValue(data.code)
	ace_editeur.setReadOnly(false)
	fld_barre_outils.disabled = false
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
