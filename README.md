# Cahier des charges du projet de suivi en ligne de TDs de programmation

## Généralités

Les adresses sont des chaînes aléatoires associées dynamiquement à des pages. Chaque adresse est ainsi son propre mot de passe, et on peut facilement donner accès à une page d'administration à plusieurs personnes ou inviter un groupe d'étudiants dans un salon.

Chaque page est chargée une seule fois, et se compose d'onglets pour ses différentes tâches. Un paramètre passé en queryString permet de spécifier une action à réaliser dans le contexte de la page courante. On réduira ainsi le nombre d'échanges client-serveur, en vue d'économiser des éventuels frais d'hébergement.

## Schémas de données

Les données de premier rang sont des variables globales du serveur. Lors de son démarrage, elles sont chargées à partir d'une base de données clés-valeurs simple. Ensuite chaque modification d'une donnée résulte en l'enregistrement en base pour la clé correspondante.

* __acces_ouverts__ - dictionnaire indexé par l'adresse de chaque page
	* __page__ - nom de la page pour redirection (`admin`, `enseignant`, `apprenant` ou `expiree`)
	* __salon__ - indice du salon pour enseignant et apprenant
* __salons__ - liste des informations sur chaque salon
	* __nom_salon__ - chaîne telle qu'affichée dans chaque interface
	* __apprenants__ - dictionnaire indexé par l'identifiant de chaque apprenant
		* __present__ - booléen indiquant si l'étudiant n'a pas quitté le salon
		* __code__ - texte contenant le dernier programme obtenu
		* __console__ - texte affiché dans la console de l'apprenant (à passer dans un sanitizer côté client mosaïque)
		* __dernier_envoi__ - timestamp de la dernière mise à jour du code ou console
		* __activite__ - liste d'évènements triée par timestamp
			* __timestamp__ - moment de réception de l'évènement
			* __action__ - `entree`, `sortie`, `envoi_code`, `demande_assistance`, `annulation_assitance`
	* __liste_assistances__ - liste ordonnée des apprenants ayant demandé assistance

## Page d'administration

Tâches à gérer :

* examiner les adresses ouvertes et leurs pages associées, les supprimer, les renommer
* Créer une page d'enseignant et lui attribuer une adresse aléatoire, ou modifier une page existante (ex. pour augmenter des quotas ou réattribuer une adresse)

## Page d'enseignant

Le statut de demande d'assistance de chaque cellule en mosaïque est une machine à 3 états (stockés comme classe de chaque cellule) :

* _∅_ - pas de demande en cours
* _checked_ - l'apprenant de la cellule est sur liste d'attente d'assistance
* _unchecking_ - l'assistance est terminée, tant que l'état est actif on inclut l'apprenant dans la liste `fin_assistance` envoyée à chaque mise à jour de la mosaïque

Les transitions sont :

* _∅_ → _checked_ sur présence du champ __position_assistance__ pour l'apprenant
* _checked_ → _∅_ sur absence du champ __position_assistance__ pour l'apprenant
* _checked_ → _unchecking_ par clic sur le bouton de fin d'assistance
* _unchecking_ → _∅_ sur absence du champ __position_assistance__ pour l'apprenant

Tâches à gérer :

* fournir ou modifier la liste des identifiants apprenants et les informations associées
* réinitialiser les présences des étudiants
* afficher une mosaïque des apprenants et un panel d'actions sur les vignettes
* lire le code d'un étudiant, l'exécuter et éventuellement augmenter son avancement dans les tests
* examiner la progression dans le temps de chaque apprenant
* visualiser un résumé des activités durant les N dernières minutes
* afficher pour chaque page un bouton/raccourci d'overlay avec la documentation intégrée
* télécharger les données du salon en fichiers CSV dans un ZIP

## Page d'apprenant

Le bouton d'assistance côté apprenant est une machine à 4 états (stockés comme classe du bouton) : 

* _∅_ - pas de demande d'assistance en cours
* _checking_ - on ajoute `demande_assistance: true` à chaque requête au serveur pour demander l'ajout en liste d'attente
* _checked_ - l'apprenant est en attente d'assistance, on envoie l'état du code et de la console à chaque requête au serveur tant que cet état est actif
* _unchecking_ - on ajoute `demande_assistance: false` à chaque requête au serveur pour demander le retrait de la liste d'attente d'assistance

Les transitions sont :

* _∅_ → _checking_ par clic sur le bouton
* _∅_ → _checked_ si le champ __position_assistance__ est présent dans une réponse du serveur
* _checking_ → _checked_ si le champ __position_assistance__ est présent dans une réponse du serveur
* _checking_ → _∅_ par clic sur le bouton
* _checked_ → _unchecking_ par clic sur le bouton
* _checked_ → _∅_ si le champ __position_assistance__ est absent d'une réponse du serveur
* _unchecking_ → _checked_ par clic sur le bouton
* _unchecking_ → _∅_ si le champ __position_assistance__ est absent d'une réponse du serveur

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
