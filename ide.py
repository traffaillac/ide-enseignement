from flask import Flask, abort, jsonify, render_template, request, send_file

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
        'code': 'print("Hello world!")',
        'console': 'Hello world!',
        'activite': {
          1602673199889: {'action': 'enregistrement'},
        },
        'avancement': [1602673199889],
        'memo_enseignant': 'Test de mémo 🙂',
      },
    },
    'tests': [],
  },
]



def page_apprenant(salon):
    if not request.args:
        return send_file('ide.html')
    try:
        identifiant = request.cookies['identifiant']
        apprenant = salon['apprenants'][identifiant]
    except: abort(401)
    tache = request.args['tache']
    if tache == 'initialisation':
        json = {k: apprenant[k] for k in ('nom_prenom')}
        return jsonify(json)



@app.route('/<adresse>')
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
