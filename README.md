# Cahier des charges du projet de suivi en ligne de TDs de programmation

## Généralités

Les adresses sont des chaînes aléatoires associées dynamiquement à des pages. Chaque adresse est ainsi son propre mot de passe, et on peut facilement donner accès à une page d'administration à plusieurs personnes ou inviter un groupe d'étudiants dans un salon.

Chaque page est chargée une seule fois, et se compose d'onglets pour ses différentes tâches. Un paramètre passé en queryString permet de spécifier une action à réaliser dans le contexte de la page courante. On réduira ainsi le nombre d'échanges client-serveur, en vue d'économiser des éventuels frais d'hébergement.

## Schémas de données

Les données de premier rang sont des variables globales du serveur. Lors de sont démarrage, elles sont chargées à partir d'une base de données clés-valeurs simple. Ensuite chaque modification d'une donnée résulte en l'enregistrement en base pour la clé correspondante.

* __acces_ouverts__ - dictionnaire indexé par l'adresse de chaque page
	* __page__ - nom de la page pour redirection (`admin`, `enseignant`, `apprenant` ou `expiree`)
	* __salon__ - indice du salon pour enseignant et apprenant
* __salons__ - liste des informations sur chaque salon
	* __apprenants__ - dictionnaire indexé par l'identifiant de chaque apprenant
		* __nom_prenom__ - chaîne telle qu'affichée dans la mosaïque
		* __code__ - texte contenant le dernier programme obtenu
		* __console__ - texte affiché dans la console de l'apprenant (à passer dans un sanitizer côté client mosaïque)
		* __activite__ - dictionnaire d'évènements indexée par timestamp
			* __action__ - `connexion`, `deconnexion`, `enregistrement`, `demande_revue`, `revue_enseignant`, `commit`
			* __description__ - texte de description si commit
		* __avancement__ - liste des timestamps des évènements où ont été passés chaque niveau de test, indexée par les numéros des tests
		* __memo_enseignant__ - texte conservant les notes de l'enseignant pour chaque apprenant
	* __tests__ - liste des scripts de tests permettant de mesurer l'avancement de chaque apprenant
		* __code__ - texte contenant le script du test

## Page d'administration

Tâches à gérer :

* examiner les adresses ouvertes et leurs pages associées, les supprimer, les renommer
* Créer une page d'enseignant et lui attribuer une adresse aléatoire, ou modifier une page existante (ex. pour augmenter des quotas ou réattribuer une adresse)

## Page d'enseignant

Tâches à gérer :

* fournir ou modifier la liste des identifiants apprenants et les informations associées
* afficher une mosaïque des apprenants et un panel d'actions sur les vignettes
* lire le code d'un étudiant, l'exécuter et éventuellement augmenter son avancement dans les tests
* examiner la progression dans le temps de chaque apprenant
* visualiser un résumé des activités durant les N dernières minutes
* afficher pour chaque page un bouton/raccourci d'overlay avec la documentation intégrée
* télécharger les données du salon en fichiers CSV dans un ZIP

## Page d'apprenant

Tâches à gérer :

* afficher un onglet pour paramétrer l'éditeur et l'interface (et décrire les paramètres avec du texte).
* associer un fichier natif Python au texte de l'éditeur (si permis par le navigateur), tel que chaque modification extérieure du fichier mette à jour l'éditeur, et chaque enregistrement depuis l'éditeur modifie le fichier.
* envoyer le code au serveur, soit automatiquement lors de l'enregistrement, soit lors de chaque demande de revue de code.
* exécuter le script courant dans un onglet de terminal Python avec coloration des différents types de messages (stdout, stderr, exceptions, informations)
* écrire dans la console stdin (sous le terminal Python) ou y charger le contenu d'un fichier, le texte n'étant pas supprimé après chaque exécution du script.
* afficher un onglet de bienvenue avec une présentation brève de l'outil
* réinitialiser son idenfiant courant pour se reconnecter

Notes :

* L'apparence visuelle (onglet actif, position du séparateur central, ...) doit être conservée à chaque rechargement de page.
* Si le fichier lié est modifié en dehors de l'éditeur et que l'éditeur contient des modifications non enregistrées, le fichier est dissocié de l'éditeur avec message d'alerte.
* Le contexte d'exécution doit être réinitialisé à chaque nouvelle exécution, pour correspondre au modèle mental de la conception d'un programme.
