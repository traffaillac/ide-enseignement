// FIXME généraliser l'utilisation de textContent

// fonctions de communication avec le serveur
const ajax = new XMLHttpRequest() // globale pour interdire les requêtes simultanées
let revision_dernier_envoi = null

function maj_ide(modification_fichier=false) {
	// préparation des données à envoyer
	const envoi = {}
	if (lbl_nom_salon.textContent === '')
		envoi.nom_salon = true
	const rev = ace_editeur.session.getUndoManager().$rev
	const fsm = btn_assistance.classList
	if ((modification_fichier && inp_envoi_auto.checked ||
		fsm.contains('checking') || fsm.contains('checked')) &&
		rev !== revision_dernier_envoi)
	{
		envoi.code = ace_editeur.getValue()
		envoi.console = txt_console.value
		revision_dernier_envoi = rev
	}
	if (fsm.contains('checking'))
		envoi.demande_assistance = true
	if (fsm.contains('unchecking'))
		envoi.demande_assistance = false
	if (Object.keys(envoi).length === 0)
		return
	
	// envoi de la requête
	ajax.open('POST', '')
	ajax.onreadystatechange = () => {
		if (ajax.readyState !== 4 || ajax.status !== 200)
			return
		const recu = JSON.parse(ajax.responseText)
		if (recu.nom_salon !== undefined)
			lbl_nom_salon.textContent = recu.nom_salon
		if (recu.position_assistance !== undefined) {
			if (!fsm.contains('unchecking')) {
				fsm.remove('checking')
				fsm.add('checked')
				btn_assistance.value = recu.position_assistance
			}
		} else {
			if (!fsm.contains('checking')) {
				fsm.remove('checked', 'unchecking')
				btn_assistance.value = ''
			}
		}
	}
	ajax.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
	ajax.send(JSON.stringify(envoi))
}

let timer_maj_ide = window.setInterval(maj_ide, 10000)
document.onvisibilitychange = () => {
	if (document.visibilityState === 'hidden') {
		window.clearInterval(timer_maj_ide)
		timer_maj_ide = null
	} else {
		timer_maj_ide = window.setInterval(maj_ide, 10000)
	}
}



// initialisation de l'éditeur de texte
let ignorer_change = false
ace.config.set('basePath', 'https://pagecdn.io/lib/ace/1.4.12/')
const ace_editeur = ace.edit('txt_editeur', {
	mode: 'ace/mode/python',
	// readOnly: true,
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
Split(['#div_gauche', '#div_droite'], {
	sizes: JSON.parse(localStorage.getItem('split_sizes') || '[50,50]'),
	gutterSize: 4,
	snapOffset: 0,
	elementStyle: (_, s, g) => ({'flex-basis': `calc(${s}% - ${g}px)`}),
	gutterStyle: (_, g) => ({'flex-basis': `${g}px`}),
	onDragEnd: (s) => localStorage.setItem('split_sizes', JSON.stringify(s)),
})



// gestion des onglets du panneau de droite
function selection_onglet(onglet, volet) {
	spn_console.classList.remove('checked')
	spn_parametres.classList.remove('checked')
	onglet.classList.add('checked')
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
if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
	txt_console.value = "L'interpréteur Python fonctionne uniquement avec Firefox et Chrome."
} else try {
	txt_console.value = "Chargement de l'interpréteur Python..."
	const pyodide_worker = new Worker('./static/webworker.js')
	pyodide_worker.onerror = (e) => {
		txt_console.value += `Plantage de l'interpréteur Python : ${e.message}`
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



// gestion de l'onglet des paramètres
inp_envoi_auto.checked = JSON.parse(localStorage.getItem('inp_envoi_auto') || 'true')
inp_envoi_auto.onchange = () => localStorage.setItem('inp_envoi_auto', JSON.stringify(inp_envoi_auto.checked))
inp_theme.value = localStorage.getItem('inp_theme') || 'xcode'
inp_theme.onchange = () => {
	ace_editeur.setTheme(`ace/theme/${inp_theme.value}`)
	localStorage.setItem('inp_theme', inp_theme.value)
}
inp_tabSize.value = localStorage.getItem('inp_tabSize') || '4'
inp_tabSize.onchange = () => {
	ace_editeur.session.setTabSize(inp_tabSize.value)
	localStorage.setItem('inp_tabSize', inp_tabSize.value)
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



// ouverture/enregistrement de fichiers avec API File System
if (window.showOpenFilePicker && window.showSaveFilePicker) {
	let ref_fichier = null
	let timestamp_fichier = 0
	lire_fichier = async () => {
		try {
			ref_fichier = (await showOpenFilePicker())[0]
			fichier = await ref_fichier.getFile()
			timestamp_fichier = fichier.lastModified
			return [fichier.name, await fichier.text()]
		} catch (e) { return undefined }
	}
	btn_nouveau.onclick = async () => {
		if (lbl_indicateur_modifie.style.visibility === 'visible' &&
			!confirm("Les modifications non sauvegardées vont être perdues, voulez-vous continuer ?"))
			return
		try {
			ref_fichier = await showSaveFilePicker()
		} catch (e) { return }
		lbl_nom_fichier.textContent = ref_fichier.name
		timestamp_fichier = (await ref_fichier.getFile()).lastModified
		lbl_indicateur_modifie.style.visibility = 'hidden'
		ignorer_change = true
		ace_editeur.session.setValue('')
		ignorer_change = false
		maj_ide(true)
	}
	btn_enregistrer.onclick = async () => {
		try {
			if (ref_fichier === null) {
				ref_fichier = await showSaveFilePicker()
				lbl_nom_fichier.textContent = ref_fichier.name
			}
			var writable = await ref_fichier.createWritable() // demande éventuellement les droits d'écriture
		} catch (e) { return }
		maj_ide(true)
		await writable.write(ace_editeur.getValue())
		await writable.close()
		timestamp_fichier = (await ref_fichier.getFile()).lastModified
		lbl_indicateur_modifie.style.visibility = 'hidden'
	}
	btn_enregistrer_sous.onclick = async () => {
		try {
			ref_fichier = await showSaveFilePicker()
			lbl_nom_fichier.textContent = ref_fichier.name
			var writable = await ref_fichier.createWritable()
		} catch (e) { return }
		maj_ide(true)
		await writable.write(ace_editeur.getValue())
		await writable.close()
		timestamp_fichier = (await ref_fichier.getFile()).lastModified
		lbl_indicateur_modifie.style.visibility = 'hidden'
	}
	lbl_nom_fichier.style.backgroundColor = 'lightblue'
	onfocus = async () => {
		lbl_nom_fichier.style.backgroundColor = 'lightblue'
		if (ref_fichier !== null) {
			const file = await ref_fichier.getFile()
			if (file.lastModified > timestamp_fichier) {
				if (lbl_indicateur_modifie.style.visibility === 'hidden') {
					ignorer_change = true
					ace_editeur.setValue(await file.text())
					ignorer_change = false
					maj_ide(true)
				} else {
					alert("Le fichier a été modifié en dehors de l'application, pensez à enregistrer les modifications faites ici !")
					lbl_nom_fichier.textContent = '<aucun fichier lié>'
					ref_fichier = null
				}
			}
		}
	}
	onblur = () => {
		lbl_nom_fichier.style.backgroundColor = 'lightgray'
	}

// ouverture/enregistrement de fichiers sans API File System
} else {
	btn_nouveau.style.display = 'none'
	lire_fichier = async () => new Promise((resolve, reject) => {
		inp_file.onchange = () => {
			const file = inp_file.files[0]
			const reader = new FileReader()
			reader.onloadend = (e) => resolve([file.name, e.srcElement.result])
			reader.readAsText(file)
		}
		inp_file.click()
	})
	btn_enregistrer.onclick = () => {
		maj_ide(true)
		const fichier = new File([ace_editeur.getValue()], lbl_nom_fichier.textContent)
		timestamp_fichier = fichier.lastModified
		a_download.href = URL.createObjectURL(fichier)
		a_download.setAttribute('download', lbl_nom_fichier.textContent)
		a_download.click()
		lbl_indicateur_modifie.style.visibility = 'hidden'
	}
	btn_enregistrer_sous.style.display = 'none'
}

// fonctions communes à l'ouverture/enregistrement de fichiers
btn_ouvrir.onclick = async () => {
	if (lbl_indicateur_modifie.style.visibility === 'visible' &&
		!confirm("Les modifications non sauvegardées vont être perdues, voulez-vous continuer ?"))
		return
	const [nom, code] = await lire_fichier()
	lbl_nom_fichier.textContent = nom
	lbl_indicateur_modifie.style.visibility = 'hidden'
	ignorer_change = true
	ace_editeur.setValue(code)
	ignorer_change = false
	
	let indent = detect_indent(code)
	if (indent === '\t') {
		inp_useSoftTabs.checked = false
		inp_useSoftTabs.onchange()
	} else if (indent !== undefined) {
		inp_useSoftTabs.checked = true
		inp_useSoftTabs.onchange()
		inp_tabSize.value = indent
		inp_tabSize.onchange()
	}
	maj_ide(true)
}
onbeforeunload = (e) => {
	if (lbl_indicateur_modifie.style.visibility === 'visible')
		return e.returnValue = "L'éditeur contient des modifications non sauvegardées, elles seront perdues si la fenêtre est fermée."
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



// commande d'appel de l'enseignant
btn_assistance.onclick = () => {
	const fsm = btn_assistance.classList
	if (fsm.contains('checking')) {
		fsm.remove('checking')
	} else if (fsm.contains('checked')) {
		fsm.replace('checked', 'unchecking')
	} else if (fsm.contains('unchecking')) {
		fsm.replace('unchecking', 'checked')
	} else {
		fsm.add('checking')
	}
	maj_ide()
}



// identification après toutes les initialisations
let identifiant = decodeURIComponent((document.cookie.split('; ').find(kv => kv.startsWith('identifiant=')) || 'identifiant=').slice('identifiant='.length))
while (identifiant === '') {
	identifiant = prompt('Veuillez renseigner votre Prénom et Nom pour accéder à ce salon') || ''
	document.cookie = `identifiant=${encodeURIComponent(identifiant)};SameSite=Strict`
}
lbl_nom_apprenant.textContent = identifiant
onpagehide = () => {
	ajax.open('POST', '')
	ajax.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
	ajax.send(JSON.stringify({sortie: true}))
}
btn_renommer.onclick = () => {
	ajax.open('POST', '', false)
	ajax.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
	ajax.send(JSON.stringify({sortie: true}))
	document.cookie = 'identifiant=;SameSite=Strict'
	document.location.reload()
}
maj_ide()
