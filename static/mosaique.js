// fonctions de communication avec le serveur
const ajax = new XMLHttpRequest()
function maj_mosaique() {
	// préparation des données à envoyer
	const envoi = { fin_assistance: Array.prototype.flatMap.call(div_mosaique.children, c => c.classList.contains('unchecking') ? [c.children[0].textContent] : []) }
	if (lbl_nom_apprenant.textContent !== '')
		envoi.nom_apprenant = lbl_nom_apprenant.textContent
	if (lbl_nom_salon.textContent === '')
		envoi.nom_salon = true
	
	// création et envoi de la requête
	ajax.open('POST', '?action=maj_mosaique')
	ajax.onreadystatechange = () => {
		if (ajax.readyState !== 4 || ajax.status !== 200)
			return
		const recu = JSON.parse(ajax.responseText)
		if ('nom_salon' in recu)
			lbl_nom_salon.textContent = recu.nom_salon
		
		// si le nombre d'apprenants a changé, on recalcule la taille de la grille
		const apprenants = recu.apprenants
		if (apprenants.length !== div_mosaique.children.length) {
			const colonnes = Math.max(Math.ceil(Math.sqrt(apprenants.length)), 3)
			const lignes = Math.max(Math.ceil(apprenants.length / colonnes), 3)
			div_mosaique.style.gridTemplateColumns = `repeat(${colonnes}, 1fr)`
			div_mosaique.style.gridTemplateRows = `repeat(${lignes}, 1fr)`
			while (div_mosaique.children.length > apprenants.length)
				div_mosaique.lastChild.remove()
			while (div_mosaique.children.length < apprenants.length) {
				div_mosaique.insertAdjacentHTML('beforeend',
					`<div class=cellule onclick="focus_apprenant(this.children[0].textContent)">
						<span></span>
						<span class=lbl_position></span>
					</div>`)
			}
		}
		
		// on transfère les données des apprenants vers les cellules de la grille
		for (let i = 0; i < apprenants.length; i++) {
			const cellule = div_mosaique.children[i]
			const apprenant = apprenants[i]
			const fsm = cellule.classList
			fsm.toggle('present', apprenant.present)
			cellule.children[0].textContent = apprenant.nom_apprenant
			cellule.children[1].textContent = apprenant.position_assistance || ''
			if ('position_assistance' in apprenant) {
				if (!fsm.contains('unchecking'))
					fsm.add('checked')
			} else {
				fsm.remove('checked', 'unchecking')
			}
			if (apprenant.nom_apprenant === lbl_nom_apprenant.textContent) {
				btn_fin_assistance.classList.toggle('checked', fsm.contains('checked'))
				btn_fin_assistance.value = apprenant.position_assistance || ''
			}
		}
		
		// récupération de données en vue apprenant
		if (('nom_apprenant' in recu) && lbl_nom_apprenant.textContent === recu.nom_apprenant) {
			ace_editeur.session.setValue(recu.code)
			let indent = detect_indent(recu.code)
			ace_editeur.session.setTabSize(indent === undefined || indent === '\t' ? 4 : indent)
			txt_console.value = recu.console
		}
	}
	ajax.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
	ajax.send(JSON.stringify(envoi))
}

let timer_maj_mosaique = window.setInterval(maj_mosaique, 10000)
document.onvisibilitychange = () => {
	if (document.visibilityState === 'hidden') {
		window.clearInterval(timer_maj_mosaique)
		timer_maj_mosaique = null
	} else {
		timer_maj_mosaique = window.setInterval(maj_mosaique, 10000)
		maj_mosaique()
	}
}
maj_mosaique()



// passage de la mosaïque à la vue apprenant
function focus_apprenant(nom_apprenant) {
	div_overlay.style.display = 'flex'
	lbl_nom_apprenant.textContent = nom_apprenant
	maj_mosaique()
}
function unfocus_apprenant() {
	div_overlay.style.display='none'
	lbl_nom_apprenant.textContent = ''
	ace_editeur.session.setValue('')
	txt_console.value = ''
}



// gestion des paramètres en vue apprenant
inp_theme.value = localStorage.getItem('inp_theme') || 'xcode'
inp_theme.onchange = () => {
	ace_editeur.setTheme(`ace/theme/${inp_theme.value}`)
	localStorage.setItem('inp_theme', inp_theme.value)
}



// commande de fin d'assistance en vue apprenant
btn_fin_assistance.onclick = () => {
	if (btn_fin_assistance.classList.contains('checked')) {
		btn_fin_assistance.classList.replace('checked', 'unchecking')
		const cellule = Array.prototype.find.call(div_mosaique.children, c => c.children[0].textContent === lbl_nom_apprenant.textContent)
		cellule.classList.replace('checked', 'unchecking')
		maj_mosaique()
	}
}



// initialisation de l'éditeur en vue apprenant
ace.config.set('basePath', 'https://pagecdn.io/lib/ace/1.4.12/')
const ace_editeur = ace.edit('txt_editeur', {
	mode: 'ace/mode/python',
	readOnly: true,
	theme: `ace/theme/${localStorage.getItem('inp_theme') || 'xcode'}`,
})



// initialisation du séparateur mobile en vue apprenant
Split(['#div_gauche', '#div_droite'], {
	sizes: JSON.parse(localStorage.getItem('split_sizes') || '[50,50]'),
	gutterSize: 4,
	snapOffset: 0,
	elementStyle: (_, s, g) => ({'flex-basis': `calc(${s}% - ${g}px)`}),
	gutterStyle: (_, g) => ({'flex-basis': `${g}px`}),
	onDragEnd: (s) => localStorage.setItem('split_sizes', JSON.stringify(s)),
})
