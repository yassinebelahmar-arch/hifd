# Tartil & Hifdh — Plateforme Professionnelle de Mémorisation du Coran (Cheikh Yasser Al-Dosari)

Une application web professionnelle dédiée à la mémorisation méthodique du Saint Coran (*Riwayat Hafs 'an 'Asim*) accompagnée de la récitation de **Cheikh Yasser Al-Dosari**, conçue autour d'un parcours inversé (du Juz 30 vers le Juz 1), d'un objectif de **0,5 Hizb par semaine** (3h réparties sur 2 à 3 sessions), d'un système rigoureux de **Double Check** (Mémorisation puis Consolidation) et d'un onglet d'exégèse (**Tafsir Al-Muyassar** en arabe et traduction/explication en français).

---

## Revue Utilisateur & Décisions Confirmées

> [!IMPORTANT]
> Les choix suivants ont été validés lors de notre échange préparatoire et constituent le socle fonctionnel de l'application :

- **Parcours de mémorisation inversé (Juz 30 → Juz 1)** : L'organisation par défaut commence par la fin du Coran (**Juz 30 — 'Amma**, puis **Juz 29 — Tabarak / Sourate Al-Mulk**, puis **Juz 28**, jusqu'au **Juz 1**). Un sélecteur rapide permet également de basculer à tout moment entre le Juz 30 (*An-Naba*) et le Juz 29 (*Al-Mulk*) ou de filtrer par Hizb (60 Hizb / 120 Demis-Hizb) et par Sourate (114 Sourates).
- **Mécanisme de Double Check avec délai de consolidation conseillé** :
  - **1er Check (Mémorisé)** : Indique que l'unité (Demi-Hizb, Hizb ou Sourate) est apprise. Déclenche un indicateur de consolidation recommandée (3 à 7 jours) et l'ajoute aux rappels prioritaires.
  - **2ème Check (Révisé & Consolidé)** : Reste cochable à tout moment mais met en évidence les passages ayant atteint leur fenêtre optimale de révision. **Seul le 2ème Check valide définitivement la progression** dans les statistiques globales et met à jour le calcul automatique de la date de fin (en années, mois et semaines).
- **Explication par verset (Tafsir dans un onglet séparé)** : Chaque verset dispose d'un volet/onglet dédié proposant prioritairement le **Tafsir Al-Muyassar en arabe** (*التفسير الميسر*) accompagné de la **traduction et d'une synthèse explicative concise en français** pour ancrer la mémorisation par le sens sans surcharger la vue de récitation.
- **Sauvegarde locale instantanée & Portabilité** : Toutes les données (checks, historique des sessions de 3h/semaine, favoris, réglages de rappels) sont sauvegardées instantanément sur l'appareil avec une fonction d'**Export / Import JSON** en un clic.

---

## 1. Vue d'Ensemble & Proposition de Valeur

- **Ce que fait l'application** : Elle réunit dans un espace de travail calme et structuré le texte intégral du Coran (*Hafs 'an 'Asim*), le lecteur audio haute fidélité de **Cheikh Yasser Al-Dosari** (avec répétition de versets pour le Hifdh), une matrice de suivi à **Double Check** sur les 30 Juz / 60 Hizb / 120 Demis-Hizb / 114 Sourates, un planificateur hebdomadaire de **3 heures (2 ou 3 sessions)** et un moteur de rappels intelligents.
- **Public cible & Contexte d'usage** : Étudiant(e) ou actif(ve) engagé(e) dans un programme régulier de Hifdh souhaitant allier écoute répétée de Cheikh Yasser Al-Dosari, compréhension profonde des versets et visibilité mathématique claire sur sa trajectoire d'achèvement du Coran.
- **Valeur clé** : Éliminer l'oubli post-mémorisation grâce au **Double Check** (qui ne comptabilise un Hizb comme acquis qu'après sa révision consolidée) et transformer un objectif de long terme en étapes hebdomadaires maîtrisées (**1/2 Hizb par semaine** via **2 à 3 séances totalisant 3h**).

---

## 2. Expérience Utilisateur & Design Visuel

### Parcours Utilisateur Clés

1. **Tableau de Bord Hifdh & Projection Dynamique** :
   - Dès l'ouverture, l'utilisateur visualise sa progression officielle (basée sur le **2ème Check**), son compteur de Hizb en attente de consolidation (**1er Check**), sa jauge hebdomadaire d'heures (**ex. 2h00 / 3h00 sur 3 sessions**) et la projection dynamique : *« Objectif actuel : 0,5 Hizb / semaine — Fin estimée dans X ans et Y mois »*.
   - Un simulateur de rythme interactif permet de voir instantanément comment l'ajout d'une session ou la validation d'un 2ème Check réduit l'échéance finale.
2. **Lecteur Coranique Hafs & Audio Cheikh Yasser Al-Dosari (Mode Hifdh)** :
   - Navigation fluide par **Juz (30 → 1)**, **Hizb (60)**, **Demi-Hizb (120)** ou **Sourate (114)** avec accès direct à *Sourate Al-Mulk* (Juz 29) et *Sourate An-Naba* (Juz 30).
   - **Mode Écoute & Répétition Hifdh** : Lecture continue de la sourate/hizb ou lecture verset par verset avec boucle de répétition personnalisable (*1x, 3x, 5x, 10x ou infini*) et plage de versets (*du verset A au verset B*) récités par **Cheikh Yasser Al-Dosari**.
   - **Mode Auto-Évaluation (Masquage Hifdh)** : Option permettant de flouter le texte des versets (et de les révéler au survol ou au clic) pour réciter de mémoire avant de valider un Check.
   - **Onglet Compréhension & Tafsir séparé** : Bascule propre entre l'onglet **« Mushaf & Hifdh »** (texte arabe épuré + validation verset/hizb) et l'onglet **« Tafsir & Sens (Al-Muyassar & Français) »** qui affiche côte à côte le verset, le *Tafsir Al-Muyassar* en arabe et l'explication concise en français.
3. **Matrice du Double Check (60 Hizb / 120 Demis-Hizb & 114 Sourates)** :
   - Chaque Demi-Hizb, Hizb et Sourate comporte deux cases de validation distinctes :
     - **Check 1 — Mémorisé** : Enregistre la date de mémorisation initiale et programme la révision de consolidation (J+3 à J+7).
     - **Check 2 — Révisé (Consolidé)** : Valide la rétention, incrémente le pourcentage officiel du Coran acquis et recalcule immédiatement la durée restante (années/mois).
4. **Planificateur 3h/Semaine & Rappels Quotidiens Intelligents** :
   - Configuration des **2 ou 3 créneaux hebdomadaires** (ex. Mardi 20h – 1h, Jeudi 20h – 1h, Dimanche 09h – 1h) avec chronomètre de session intégré pour enregistrer le temps réel passé.
   - **Wird de Révision Quotidien Intelligent** : Génération automatique chaque jour de la liste prioritaire : (1) les Demis-Hizb ayant franchi le 1er Check il y a 3 à 7 jours à valider en 2ème Check, et (2) la rotation périodique des Hizb déjà doublement validés pour maintenir une rétention à long terme.

### Identité Visuelle & Thème (Éditorial Manuscrit & Tableau de Bord de Précision)

- **Direction Esthétique** : Inspiration *Manuscrit Islamique Contemporain & Édition Muséale* — alliant la sérénité du papier parchemin chaud pour la lecture coranique à la rigueur d'un tableau de bord analytique moderne. Support complet du mode Clair (*Papier Alabaster*) et du mode Sombre (*Nuit Médinoise*).
- **Palette de Couleurs (Discipline 60-30-10)** :
  - *Dominante (60% — Toile de fond)* : Crème Alabaster doux (`#FBF9F5`) en mode clair / Ardoise Nuit profonde (`#0C111D`) en mode sombre.
  - *Structurelle (30% — Surfaces & Cartes)* : Pierre chaude (`#F3EFE6`) et bordures fines (`#E5DEC9`) en mode clair / Surface calfeutrée (`#151C2C`) en mode sombre. Texte principal en Encre Anthracite (`#1C1917`).
  - *Accents Sémantiques (10%)* :
    - **Émeraude Profond (`#0F5132` / `#10B981`)** : Action principale, lecture audio active et validation du **2ème Check (Consolidé)**.
    - **Or Ambré / Bronze (`#B45309` / `#F59E0B`)** : État intermédiaire du **1er Check (Mémorisé — en attente de 2ème Check)** et rappels de révision du jour.
- **Typographie & Hiérarchie (Règle 2+1 + Calligraphie Coranique)** :
  - *Texte Coranique & Tafsir Arabe* : `Amiri Quran` / `Amiri` (Google Fonts), corps généreux (`28px`–`36px`), interlignage ample (`2.2`) pour un respect parfait des signes de vocalisation (*Tashkeel*) de la *Riwayat Hafs 'an 'Asim*.
  - *Titres & En-têtes* : `Cormorant Garamond` (sérif éditorial noble) pour les titres de sections et noms de sourates.
  - *Interface & Corps de texte* : `Plus Jakarta Sans` pour une lisibilité irréprochable des contrôles et explications en français.
  - *Métriques, Compteurs & Chronomètre* : `JetBrains Mono` avec chiffres tabulaires (`tabular-nums`) pour les statistiques, le compte à rebours en années/mois et le lecteur audio.
- **Contrat de Navigation & Architecture Spatiale** :
  - Barre supérieure épurée en 3 zones : Marque **« Tartil & Hifdh »** à gauche, 4 onglets de navigation à ligne unique au centre (*Tableau de Bord*, *Coran & Écoute*, *Suivi Double Check*, *Planning & Rappels*), et 1 bouton d'action principale à droite (*Démarrer Session Hifdh*).
  - Métadonnées affichées sous forme de texte typographique sobre séparé par des points médians (`Juz 29 · Hizb 57 · 30 Versets · Mecquoise`), sans badges superflus.

---

## 3. Décisions Produit Clés & Compromis

- **Décision 1 : Unité granulaire en Demi-Hizb (120 unités) synchronisée avec les 60 Hizb et 114 Sourates**
  - *Approche choisie* : Structurer les 60 Hizb en **120 Demis-Hizb (Nisf Hizb)** tout en permettant aussi le coche par Hizb entier ou par Sourate.
  - *Pourquoi* : Votre objectif est de **0,5 Hizb par semaine**. En modélisant directement chaque moitié de Hizb (avec ses sourates et versets exacts de début et de fin), vous pouvez valider votre 1er et 2ème Check chaque semaine avec une précision mathématique immédiate sur la date de fin.
- **Décision 2 : Architecture Hybride API Coranique Officielle + Données de Secours Hors-Ligne**
  - *Approche choisie* : Connexion directe à l'API ouverte `api.alquran.cloud` pour charger à la demande les 114 sourates en *Hafs 'an 'Asim* (`quran-uthmani`), le **Tafsir Al-Muyassar** (`ar.muyassar`), la traduction française (`fr.hamidullah`) et les flux audio MP3 haute qualité de **Cheikh Yasser Al-Dosari** (par verset via `everyayah.com` / `islamic.network` et par sourate complète via `mp3quran.net`), complétée par un cache local intelligent et les métadonnées complètes des 30 Juz / 60 Hizb / 114 Sourates pré-embarquées.
  - *Pourquoi* : Garantit une disponibilité instantanée de la structure des 60 Hizb et des statistiques même sans latence réseau, tout en offrant l'intégralité des 6 236 versets, leur Tafsir Al-Muyassar et la voix authentique de Cheikh Yasser Al-Dosari.

---

## 4. Architecture Technique & Stratégie de Données

### Diagramme d'Architecture & Hiérarchie des Composants

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     TARTIL & HIFDH — APPLICATION CLIENT                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  En-tête (Top Bar 3 Zones)                                                   │
│  [Tartil & Hifdh] ── [Tableau de Bord | Coran & Écoute | Double Check |      │
│                       Planning & Rappels] ── [Bouton: Session Hifdh (Chrono)]│
├──────────────────────┬───────────────────────────┬───────────────────────────┤
│ 1. TABLEAU DE BORD   │ 2. CORAN, AUDIO & TAFSIR  │ 3. MATRICE DOUBLE CHECK   │
│    & STATISTIQUES    │    (YASSER AL-DOSSARI)    │    & PLANNING 3H/SEMAINE  │
│ ┌──────────────────┐ │ ┌───────────────────────┐ │ ┌───────────────────────┐ │
│ │ KPI & Projection │ │ │ Sélecteur Inverse     │ │ │ Parcours Juz 30 -> 1  │ │
│ │ Fin (Ans + Mois) │ │ │ Juz 30->1 / Hizb /    │ │ │ 60 Hizb / 120 Demis   │ │
│ │ (Basé Check 2)   │ │ │ Sourate (Mulk, Naba…) │ │ │ + 114 Sourates        │ │
│ └──────────────────┘ │ └───────────────────────┘ │ └───────────────────────┘ │
│ ┌──────────────────┐ │ ┌───────────────────────┐ │ ┌───────────────────────┐ │
│ │ Jauge Hebdo      │ │ │ Onglet A: Mushaf Hafs │ │ │ Double Check Engine   │ │
│ │ 3h / 2-3 séances │ │ │ + Mode Masquage Hifdh │ │ │ [1] Mémorisé (Ambre)  │ │
│ └──────────────────┘ │ ├───────────────────────┤ │ │ [2] Révisé   (Émeraude│ │
│ ┌──────────────────┐ │ │ Onglet B: Explication │ │ └───────────────────────┘ │
│ │ Wird Quotidien & │ │ │ • Arabe: Al-Muyassar  │ │ ┌───────────────────────┐ │
│ │ Rappels Révision │ │ │ • Français: Synthèse  │ │ │ Planificateur 2-3     │ │
│ └──────────────────┘ │ └───────────────────────┘ │ │ Sessions + Rappels    │ │
│                      │ ┌───────────────────────┐ │ └───────────────────────┘ │
│                      │ │ Barre Audio Persistante│ │                           │
│                      │ │ Cheikh Yasser Dossari │ │                           │
│                      │ │ Boucle 1x/3x/5x/Plage │ │                           │
│                      │ └───────────────────────┘ │                           │
└──────────────────────┴─────────────┬─────────────┴───────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌─────────────────────────────────────────┐   ┌────────────────────────────────┐
│ MOTEUR LOGIQUE & STOCKAGE LOCAL         │   │ SERVICES CORANIQUES & AUDIO    │
│ • Calculateur d'objectif & date de fin  │   │ • Texte Uthmani (Hafs 'an Asim)│
│ • État Double Check (Check 1 & Check 2) │   │ • Audio Cheikh Yasser Dossari  │
│ • Journal des sessions (3h/semaine)     │   │   (Par verset & Sourate entière│
│ • Générateur de rappels (J+3 à J+7)     │   │ • Tafsir Al-Muyassar (Arabe)   │
│ • Export / Import JSON de sauvegarde    │   │ • Traduction & Sens (Français) │
└─────────────────────────────────────────┘   └────────────────────────────────┘
```

### Modèle de Données & Règles Métier

- **Unité de Progression (`HizbHalfProgress` & `SurahProgress`)** :
  - `id` : Identifiant du Demi-Hizb (`1` à `120`, regroupés en `60 Hizb` et `30 Juz`, présentés par défaut du Juz 30 au Juz 1).
  - `check1Memorized` (`boolean`) & `check1Date` (`ISO timestamp | null`) : Premier niveau de validation (Mémorisé).
  - `check2Revised` (`boolean`) & `check2Date` (`ISO timestamp | null`) : Second niveau de validation (Révisé & Consolidé).
  - **Règle de Calcul des Statistiques & Projection de Fin** :
    - $\text{Demis-Hizb Validés} = \text{Nombre d'unités avec } \texttt{check2Revised === true}$.
    - $\text{Demis-Hizb Restants} = 120 - \text{Demis-Hizb Validés}$.
    - Avec un rythme cible $R$ (par défaut $R = 0,5\text{ Hizb/semaine} = 1\text{ Demi-Hizb/semaine}$), le nombre de semaines restantes est $S = \frac{\text{Hizb Restants}}{R}$, converti dynamiquement en **Années, Mois et Semaines** ainsi qu'en date calendaire estimée.
- **Suivi Hebdomadaire des Sessions (`WeeklySessionLog`)** :
  - Configuration des 2 ou 3 jours de session (ex. Lun / Mer / Sam) pour atteindre la cible de **180 minutes (3h) par semaine**.
  - Historique des sessions réalisées (date, durée en minutes, Hizb/Sourate travaillés, type : *Nouvelle mémorisation* ou *Révision 2ème Check*).

### Mapping des Composants Interactifs & Transitions d'État

1. **Action sur le 1er Check (Mémorisé)** :
   - Coche le 1er indicateur, enregistre la date du jour, incrémente le compteur *« En cours de consolidation »* et ajoute automatiquement ce Demi-Hizb/Sourate dans la file des rappels de révision avec une échéance conseillée à J+3.
2. **Action sur le 2ème Check (Révisé & Consolidé)** :
   - Si le 1er Check n'était pas encore coché, coche automatiquement le 1er et le 2ème Check.
   - Met à jour instantanément la jauge principale de complétion du Coran (sur 60 Hizb / 30 Juz), recalcule l'objectif temporel (*ex. passage de « 2 ans et 4 mois » à « 2 ans et 3 mois »*), et planifie l'élément dans le cycle de révision espacée à long terme.
3. **Lecteur Audio Cheikh Yasser Al-Dosari & Bascule Tafsir** :
   - Cliquer sur un verset lance la récitation de Cheikh Yasser Al-Dosari pour ce verset, applique le mode de répétition choisi (ex. répéter 5 fois le verset pour le mémoriser), et synchronise le défilement.
   - Cliquer sur l'onglet **« Explication & Tafsir »** (ou sur le bouton d'explication d'un verset) affiche le **Tafsir Al-Muyassar en arabe** ainsi que la traduction et le résumé explicatif en français sans interrompre l'audio en cours.
