const ajax = new XMLHttpRequest()
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
