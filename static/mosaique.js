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
			while (div_mosaique.children.length < apprenants.length)
				div_mosaique.insertAdjacentHTML('beforeend', '<div><span>Test</span></div>')
		}
		
		// on transfère les données des apprenants vers les cellules de la grille
		for (let i = 0; i < apprenants.length; i++) {
			const cellule = div_mosaique.children[i]
			const apprenant = apprenants[i]
			cellule.children[0].innerText = apprenant.nom_apprenant
			cellule.className = apprenant.statut
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



// ancien code
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