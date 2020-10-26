from flask import Flask, abort, jsonify, render_template, request, send_file
from time import time

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
    'apprenants': {
      'traffail': {
        'nom_prenom': 'Thibault Raffaillac',
        'statut': 'absent',
        'code': 'print("Hello world!")',
        'console': 'Hello world!',
        'avancement': [1602673199889],
        'memo_enseignant': 'Test de mémo 🙂',
        'activite': {
          1602673199889: {'action': 'envoi_code'},
        },
      },
    },
    'tests': [],
  },
]



def page_apprenant(salon):
    if not request.args:
        return send_file('ide.html')
    
    # vérification de la valididé de l'identifiant
    try:
        identifiant = request.cookies['identifiant']
        apprenant = salon['apprenants'][identifiant]
    except: abort(401)
    
    # lecture de l'action et traitements communs
    action = request.args['action']
    if action not in ('connexion', 'deconnexion', 'envoi_code', 'demande_revue'):
        abort(401)
    activite = {'action': action}
    apprenant['activite'][round(time() * 1000)] = activite
    
    # traitements spécifiques à chaque action
    if action == 'connexion':
        apprenant['statut'] = 'present'
        json = {k: apprenant[k] for k in ('nom_prenom',)}
        return jsonify(json)
    elif action == 'deconnexion':
        apprenant['statut'] = 'absent'
    elif action == 'envoi_code':
        code = request.json['code'][:100_000] # protection contre les contenus massifs
        console = request.json['console'][-100_000:]
        apprenant['code'] = code
        apprenant['console'] = console
    elif action == 'demande_revue':
        apprenant['statut'] = 'main_levee'



def page_enseignant(salon):
    if not request.args:
        return send_file('mosaique.html')
    
    # lecture de l'action et traitements spécifiques
    action = request.args['action']
    if action == 'liste_apprenants':
        return jsonify(salon['apprenants'])



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
