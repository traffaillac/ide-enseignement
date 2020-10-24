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
let ignorer_change = false
let version_fichier = 0



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
	//readOnly: true,
	showInvisibles: JSON.parse(localStorage.getItem('inp_showInvisibles') || 'false'),
	tabSize: JSON.parse(localStorage.getItem('inp_tabSize') || '4'),
	theme: `ace/theme/${localStorage.getItem('inp_theme') || 'xcode'}`,
	useSoftTabs: JSON.parse(localStorage.getItem('inp_useSoftTabs') || 'true'),
})
ace_editeur.session.on('change', (delta) => {
	if (!ignorer_change) {
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
	spn_parametres.classList.remove('onglet_actif')
	onglet.classList.add('onglet_actif')
	txt_console.style.display = 'none'
	div_parametres.style.display = 'none'
	volet.style.display = null
	localStorage.setItem('onglet_actif', onglet.id)
	localStorage.setItem('volet_actif', volet.id)
}
spn_console.onclick = () => selection_onglet(spn_console, txt_console)
spn_parametres.onclick = () => selection_onglet(spn_parametres, div_parametres)
selection_onglet(
	document.getElementById(localStorage.getItem('onglet_actif') || 'spn_console'),
	document.getElementById(localStorage.getItem('volet_actif') || 'txt_console')
)



// initialisation de l'interpréteur Python dans un thread distinct
txt_console.value += "Chargement de l'interpréteur Python..."
try {
	const pyodide_worker = new Worker('./static/webworker.js')
	pyodide_worker.onerror = (e) => {
		console.log(`Error in pyodide_worker at ${e.filename}, line ${e.lineno}: ${e.message}`)
	}
	pyodide_worker.onmessage = (e) => {
		btn_executer.disabled = false
		txt_console.value += e.data
	}
	btn_executer.onclick = async () => {
		pyodide_worker.postMessage(ace_editeur.getValue())
	}
} catch (e) {
	txt_console.value += ` erreur (recharger la page)\n${e}\n`
}



// gestion des paramètres de l'application
inp_envoi_auto.checked = JSON.parse(localStorage.getItem('inp_envoi_auto') || 'true')
inp_envoi_auto.onchange = () => localStorage.setItem('inp_envoi_auto', JSON.stringify(inp_envoi_auto.checked))
inp_theme.value = localStorage.getItem('inp_theme') || 'xcode'
inp_theme.onchange = () => {
	ace_editeur.setTheme(`ace/theme/${inp_theme.value}`)
	localStorage.setItem('inp_theme', inp_theme.value)
}
inp_useSoftTabs.checked = JSON.parse(localStorage.getItem('inp_useSoftTabs') || 'true')
inp_useSoftTabs.onchange = () => {
	ace_editeur.session.setUseSoftTabs(inp_useSoftTabs.checked)
	localStorage.setItem('inp_useSoftTabs', JSON.stringify(inp_useSoftTabs.checked))
}
inp_showInvisibles.checked = JSON.parse(localStorage.getItem('inp_showInvisibles') || 'false')
inp_showInvisibles.onchange = () => {
	ace_editeur.setShowInvisibles(inp_showInvisibles.checked)
	localStorage.setItem('inp_showInvisibles', JSON.stringify(inp_showInvisibles.checked))
}
inp_tabSize.value = localStorage.getItem('inp_tabSize') || '4'
inp_tabSize.onchange = () => {
	ace_editeur.session.setTabSize(inp_tabSize.value)
	localStorage.setItem('inp_tabSize', inp_tabSize.value)
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



// commandes d'association du code à un fichier
btn_nouveau.onclick = async () => {
	if (inp_envoi_auto.checked)
		envoi_code()
	ref_fichier = await showSaveFilePicker()
	lbl_nom_fichier.textContent = ref_fichier.name
	version_fichier = (await ref_fichier.getFile()).lastModified
	lbl_indicateur_modifie.style.visibility = 'hidden'
	ignorer_change = true
	ace_editeur.session.setValue('')
	ignorer_change = false
}

btn_ouvrir.onclick = async () => {
	if (inp_envoi_auto.checked)
		envoi_code()
	ref_fichier = (await showOpenFilePicker())[0]
	lbl_nom_fichier.textContent = ref_fichier.name
	const file = await ref_fichier.getFile()
	version_fichier = file.lastModified
	lbl_indicateur_modifie.style.visibility = 'hidden'
	ignorer_change = true
	ace_editeur.setValue(await file.text())
	ignorer_change = false
}

btn_enregistrer.onclick = async () => {
	if (inp_envoi_auto.checked)
		envoi_code()
	if (ref_fichier === null) {
		ref_fichier = await showSaveFilePicker()
		lbl_nom_fichier.textContent = ref_fichier.name
	}
	const writable = await ref_fichier.createWritable() // demande éventuellement les droits d'écriture
	await writable.write(ace_editeur.getValue())
	await writable.close()
	version_fichier = (await ref_fichier.getFile()).lastModified
	lbl_indicateur_modifie.style.visibility = 'hidden'
}

btn_enregistrer_sous.onclick = async () => {
	if (inp_envoi_auto.checked)
		envoi_code()
	ref_fichier = await showSaveFilePicker()
	lbl_nom_fichier.textContent = ref_fichier.name
	const writable = await ref_fichier.createWritable()
	await writable.write(ace_editeur.getValue())
	await writable.close()
	version_fichier = (await ref_fichier.getFile()).lastModified
	lbl_indicateur_modifie.style.visibility = 'hidden'
}

onbeforeunload = (e) => {
	if (lbl_indicateur_modifie.style.visibility === 'visible')
		return e.returnValue = "L'éditeur contient des modifications non sauvegardées, elles seront perdues si la fenêtre est fermée."
}

onfocus = async () => {
	if (ref_fichier !== null) {
		const file = await ref_fichier.getFile()
		if (file.lastModified > version_fichier) {
			if (lbl_indicateur_modifie.style.visibility === 'hidden') {
				if (inp_envoi_auto.checked)
					envoi_code()
				ignorer_change = true
				ace_editeur.setValue(await file.text())
				ignorer_change = false
			} else {
				alert("Le fichier a été modifié en dehors de l'application, pensez à enregistrer les modifications faites ici !")
				lbl_nom_fichier.innerText = '<aucun fichier lié>'
				ref_fichier = null
			}
		}
	}
}
