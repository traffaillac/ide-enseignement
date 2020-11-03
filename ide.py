from flask import Flask, abort, jsonify, render_template, request, send_file
from time import time
from urllib.parse import unquote

app = Flask(__name__)


# Données persistantes du serveur
acces_ouverts = {
	'admin': {'page': 'admin'},
	'enseignant': {'page': 'enseignant', 'salon': 0},
	'apprenant': {'page': 'apprenant', 'salon': 0},
	'expiree': {'page': 'expiree'},
}
salons = [
  {
	'nom_salon': 'Groupe A1a',
	'apprenants': {
	  'Thibault Raffaillac': {
		'statut': 'absent',
		'code': 'print("Hello world!")',
		'console': 'Hello world!',
		'dernier_envoi': 1602673199889,
		'activite': [
			(1602673199889, 'envoi_code'),
		],
	  },
	},
	'liste_assistances': [],
  },
]



def page_apprenant(salon):
	if request.method == 'GET':
		return send_file('ide.html')
	recu = request.json
	envoi = {}
	timestamp = round(time() * 1000)
	
	# recherche de l'apprenant et création d'un nouveau si inconnu
	apprenants = salon['apprenants']
	try: identifiant = unquote(request.cookies['identifiant'])
	except: abort(400)
	apprenant = apprenants.setdefault(identifiant, {
		'statut': 'present',
		'code': '',
		'console': '',
		'dernier_envoi': 0,
		'activite': []})
	
	# gestion des entrées/sorties dans le salon
	activite = apprenant['activite']
	if 'sortie' in recu:
		apprenant['statut'] = 'absent'
		activite.append((timestamp, 'sortie'))
		return ('', 204)
	if apprenant['statut'] == 'absent':
		apprenant['statut'] = 'present'
		activite.append((timestamp, 'entree'))
	if 'nom_salon' in recu:
		envoi['nom_salon'] = salon['nom_salon']
	
	# gestion des demandes d'assistance
	liste_assistances = salon['liste_assistances']
	if recu['demande_assistance'] == True and apprenant['statut'] != 'attente_assistance':
		apprenant['statut'] = 'attente_assistance'
		liste_assistances.append(apprenant)
	elif recu['demande_assistance'] == False and apprenant['statut'] == 'attente_assistance':
		apprenant['statut'] = 'present'
		liste_assistances.remove(apprenant)
	if apprenant['statut'] == 'attente_assistance':
		envoi['position_assistance'] = liste_assistances.index(apprenant) + 1
	
	# réception de code
	if 'code' in recu and 'console' in recu:
		apprenant['code'] = recu['code']
		apprenant['console'] = recu['console']
		print(apprenant['console'])
		apprenant['dernier_envoi'] = timestamp
		activite.append((timestamp, 'envoi_code'))
	return jsonify(envoi)



def page_enseignant(salon):
	if request.method == 'GET':
		return send_file('mosaique.html')
	recu = request.json
	envoi = {}
	
	# lecture de l'action et traitements spécifiques
	action = request.args['action']
	if action == 'maj_mosaique':
		apprenants = salon['apprenants']
		if 'nom_salon' in recu:
			envoi['nom_salon'] = salon['nom_salon']
		envoi_apprenants = envoi['apprenants'] = []
		for identifiant, apprenant in apprenants.items():
			envoi_apprenant = {}
			envoi_apprenants.append(envoi_apprenant)
			envoi_apprenant['nom_apprenant'] = identifiant
			statut = envoi_apprenant['statut'] = apprenant['statut']
			if statut == 'attente_assistance':
				envoi_apprenant['position_assistance'] = salon['liste_assistances'].index(apprenant) + 1
		if 'nom_apprenant' in recu:
			nom_apprenant = recu['nom_apprenant']
			apprenant = apprenants[nom_apprenant]
			envoi['nom_apprenant'] = nom_apprenant
			envoi['code'] = apprenant['code']
			envoi['console'] = apprenant['console']
			envoi['dernier_envoi'] = apprenant['dernier_envoi']
	return jsonify(envoi)



@app.route('/<adresse>', methods=('GET', 'POST'))
def repartiteur(adresse):
	try: acces = acces_ouverts[adresse]
	except: abort(404)
	page = acces['page']
	if page == 'admin':
		return page_admin()
	elif page == 'expiree':
		abort(410)
	salon = salons[acces['salon']]
	if page == 'apprenant':
		return page_apprenant(salon)
	elif page == 'enseignant':
		return page_enseignant(salon)



if __name__ == '__main__':
	app.run()
