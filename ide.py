from flask import Flask, jsonify, render_template, request

# L'ensemble des données d'une mosaïque est une liste, pour pouvoir distinguer
#   les groupes de vues des vues individuelles.
# Chaque vue est un dict avec les attributs suivants :
# _ user - nom de l'utilisateur tel qu'on l'affiche (clé primaire)
# _ timestamp - date de dernière activité
# _ filename - nom du fichier en cours de modification
# _ code - contenu du fichier en cours de modification
donnees = []


app = Flask(__name__, static_url_path='')


@app.route('/')
def index():
	return app.send_static_file('ide.html')


@app.route('/protocole', methods=['GET', 'POST'])
def protocole():
	if request.method == 'POST':
		new = request.json
		user = new['user']
		try:
			next(d for d in donnees if d['user'] == user).update(new)
		except:
			donnees.append(new)
		return ('', 204)
	else:
		return jsonify(donnees)


if __name__ == '__main__':
	app.run()
