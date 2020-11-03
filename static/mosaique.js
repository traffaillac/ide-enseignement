// fonctions de communication avec le serveur
function maj_mosaique() {
	// préparation des données à envoyer
	const envoi = { fin_assistance: Array.prototype.flatMap.call(div_mosaique.children, c => c.classList.contains('unchecking') ? [c.children[0].innerText] : []) }
	if (lbl_nom_apprenant.innerText !== '')
		envoi.nom_apprenant = lbl_nom_apprenant.innerText
	if (lbl_nom_salon.innerText === '')
		envoi.nom_salon = true
	
	// création et envoi de la requête
	const ajax = new XMLHttpRequest()
	ajax.timeout = 1000 // évite de désorienter l'utilisateur avec des feedbacks différés
	ajax.onreadystatechange = () => {
		if (ajax.readyState !== 4 || ajax.status !== 200)
			return
		const recu = JSON.parse(ajax.responseText)
		if ('nom_salon' in recu)
			lbl_nom_salon.innerText = recu.nom_salon
		
		// si le nombre d'apprenants a changé, on recalcule la taille de la grille
		const apprenants = recu.apprenants
		if (apprenants.length !== div_mosaique.children.length) {
			const colonnes = Math.ceil(Math.sqrt(apprenants.length))
			const lignes = Math.ceil(apprenants.length / colonnes)
			div_mosaique.style.gridTemplateColumns = `repeat(${colonnes}, 1fr)`
			div_mosaique.style.gridTemplateRows = `repeat(${lignes}, 1fr)`
			while (div_mosaique.children.length > apprenants.length)
				div_mosaique.lastChild.remove()
			while (div_mosaique.children.length < apprenants.length) {
				div_mosaique.insertAdjacentHTML('beforeend',
					`<div onclick="focus_apprenant(this.children[0].innerText)">
						<span></span>
						<span class=lbl_position></span>
					</div>`)
			}
		}
		
		// on transfère les données des apprenants vers les cellules de la grille
		for (let i = 0; i < apprenants.length; i++) {
			const cellule = div_mosaique.children[i]
			const apprenant = apprenants[i]
			cellule.className = apprenant.statut
			cellule.children[0].innerText = apprenant.nom_apprenant
			cellule.children[1].innerText = apprenant.position_assistance || ''
			
		}
		
		// récupération de données en vue apprenant
		if (('nom_apprenant' in recu) && lbl_nom_apprenant.innerText === recu.nom_apprenant) {
			ace_editeur.session.setValue(recu.code)
			let indent = detect_indent(recu.code)
			ace_editeur.session.setTabSize(indent === undefined || indent === '\t' ? 4 : indent)
			txt_console.value = recu.console
		}
	}
	ajax.open('POST', '?action=maj_mosaique')
	ajax.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
	ajax.send(JSON.stringify(envoi))
}

let timer_maj_mosaique = window.setInterval(maj_mosaique, 10000)
document.onvisibilitychange = () => {
	if (document.visibilityState !== 'visible') {
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
	lbl_nom_apprenant.innerText = nom_apprenant
	maj_mosaique()
}
function unfocus_apprenant() {
	div_overlay.style.display='none'
	lbl_nom_apprenant.innerText = ''
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
	if (btn_fin_assistance.classList.contains('checked'))
		btn_fin_assistance.classList.replace('checked', 'unchecking')
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



/*const ajax = new XMLHttpRequest()
const ace_modelist = ace.require('ace/ext/modelist')
const ace_editeur = ace.edit('txt_editeur')
ace_editeur.setTheme('ace/theme/monokai')
ace_editeur.session.setMode('ace/mode/python')
ace_editeur.setReadOnly(true)

let donnees = []

function zoom(index) {
	ace_editeur.setValue(donnees[index].code)
	overlay.style.display = 'flex'
}

async function maj_mosaique() {
	ajax.open('GET', 'protocole', false)
	ajax.send()
	if (ajax.status !== 200)
		return
	donnees = JSON.parse(ajax.responseText)
	mosaique.innerHTML = ''
	for (const [i, d] of donnees.entries()) {
		mosaique.insertAdjacentHTML('beforeend', `<div class=vue onclick="zoom('${i}')">${d.user}</div>`)
	}
}

*/