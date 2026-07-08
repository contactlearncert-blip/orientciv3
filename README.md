# OrientCI

Plateforme d'orientation post-bac pour les lycéens et étudiants ivoiriens :
filières des universités et grandes écoles (critères d'accès, débouchés),
bourses d'études, et suivi de trafic via une administration protégée.

Données de filières sourcées de la Direction de l'Orientation et des Bourses
(DOB — Ministère de l'Enseignement Supérieur et de la Recherche Scientifique,
édition 2025) et de la brochure de concours INP-HB, session 2025.

## Structure du projet

```
orientci/
├── app.py                     → serveur Flask (site + API de tracking + admin)
├── requirements.txt
├── orientci.db                → base SQLite (créée automatiquement au 1er lancement)
├── templates/
│   ├── index.html             → page principale
│   └── admin/
│       ├── login.html
│       └── dashboard.html
└── static/
    ├── style.css
    └── script.js
```

## Installation et lancement

```bash
cd orientci
python3 -m venv venv
source venv/bin/activate        # sous Windows : venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Le site est alors disponible sur **http://127.0.0.1:5000**
L'administration est sur **http://127.0.0.1:5000/admin**

## Identifiants admin par défaut

```
Utilisateur : admin
Mot de passe : orientci2026
```

⚠️ **À changer avant toute mise en ligne publique.** Définis tes propres
valeurs via des variables d'environnement avant de lancer le serveur :

```bash
export ADMIN_USERNAME="ton_identifiant"
export ADMIN_PASSWORD="un_mot_de_passe_solide"
export SECRET_KEY="une_longue_chaine_aleatoire"
python app.py
```

## Ce que suit l'administration

Chaque visite et chaque interaction (ouverture d'une fiche établissement,
recherche, filtre par ville, clic sur un lien officiel, clic sur une bourse)
est enregistrée dans `orientci.db` via l'endpoint `POST /api/track`, appelé
silencieusement par `script.js`. Le tableau de bord (`/admin`) affiche :

- le nombre de visites totales / du jour / de visiteurs uniques (estimation
  par hash d'IP tronqué, sans conservation de l'IP en clair) ;
- un graphique des visites sur 14 jours ;
- les filières les plus consultées, les recherches les plus fréquentes, les
  villes les plus filtrées, les bourses les plus cliquées ;
- le flux d'activité récente.

Si le backend n'est pas lancé (par exemple si `index.html` est ouvert
directement dans un navigateur sans passer par Flask), le site fonctionne
normalement : les appels de suivi échouent silencieusement.

## Déploiement

Pour une mise en ligne réelle : utiliser un serveur WSGI de production
(gunicorn, uWSGI) derrière un reverse proxy HTTPS (nginx, Caddy), définir
les variables d'environnement `ADMIN_USERNAME`, `ADMIN_PASSWORD` et
`SECRET_KEY`, et sauvegarder régulièrement `orientci.db`.

```bash
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:8000 app:app
```

## Mentions

Les données de filières, critères d'accès et débouchés sont fournies à
titre indicatif. Elles peuvent évoluer : vérifier toujours auprès de
l'établissement via son site officiel avant une inscription.

Site conçu et développé par **webZa** — webza.univers-ci.site
