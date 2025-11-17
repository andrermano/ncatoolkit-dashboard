# Instructions de transfert et déploiement

## 📦 Vous avez téléchargé l'archive `ncatoolkit-dashboard.tar.gz`

### Étape 1 : Extraire l'archive

```bash
# Sur votre machine locale (Linux/Mac)
tar -xzf ncatoolkit-dashboard.tar.gz
cd no-code-architects-toolkit-ui

# Sur Windows (avec Git Bash ou WSL)
tar -xzf ncatoolkit-dashboard.tar.gz
cd no-code-architects-toolkit-ui

# Ou utilisez un outil graphique comme 7-Zip, WinRAR, etc.
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

### Étape 3 : Configurer les variables d'environnement (pour test local)

```bash
# Copier le fichier exemple
cp .env.local.example .env.local

# Éditer .env.local avec vos valeurs
# TOOLKIT_API_URL=http://localhost:8080
# TOOLKIT_API_KEY=votre_clé
```

### Étape 4 : Tester localement (optionnel)

```bash
# Démarrer en mode développement
npm run dev

# Ouvrir http://localhost:3000
```

### Étape 5 : Pousser sur GitHub

```bash
# Le repo Git est déjà initialisé avec remote configuré
# Vérifier le remote
git remote -v

# Devrait afficher :
# origin  https://github.com/Davidb-2107/ncatoolkit-dashboard.git (fetch)
# origin  https://github.com/Davidb-2107/ncatoolkit-dashboard.git (push)

# Pousser le code
git push -u origin main

# Si demandé, entrer vos credentials GitHub
# Username : Davidb-2107
# Password : [votre token ou mot de passe]
```

### Étape 6 : Déployer sur Vercel

#### Option A : Via l'interface web (recommandé)

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Se connecter avec GitHub
3. Sélectionner le repo `Davidb-2107/ncatoolkit-dashboard`
4. Configurer les variables d'environnement :
   - `TOOLKIT_API_URL` : URL de votre API (https://...)
   - `TOOLKIT_API_KEY` : Votre clé API
5. Cliquer "Deploy"
6. Attendre 2-3 minutes
7. C'est en ligne ! 🎉

#### Option B : Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
vercel

# Ou directement en production
vercel --prod
```

## 🔧 Troubleshooting

### Problème : `git push` demande authentification

**Solution 1 : Utiliser un Personal Access Token**
1. Aller sur https://github.com/settings/tokens
2. Générer un token (Classic) avec permissions `repo`
3. Utiliser le token comme mot de passe lors du push

**Solution 2 : Configurer SSH**
1. Générer une clé SSH : `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Ajouter la clé à GitHub : https://github.com/settings/keys
3. Changer le remote : `git remote set-url origin git@github.com:Davidb-2107/ncatoolkit-dashboard.git`
4. Pousser : `git push -u origin main`

### Problème : `npm install` échoue

**Solution :**
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Problème : Port 3000 déjà utilisé

**Solution :**
```bash
# Utiliser un autre port
PORT=3001 npm run dev
```

## 📚 Documentation

- `README.md` - Documentation complète du projet
- `VERCEL_DEPLOYMENT.md` - Guide détaillé de déploiement Vercel
- `QUICKSTART.md` - Guide de démarrage rapide

## ✅ Checklist

- [ ] Archive extraite
- [ ] `npm install` exécuté
- [ ] `.env.local` configuré (pour test local)
- [ ] Testé localement (optionnel)
- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Déployé sur Vercel
- [ ] Application testée en production

## 🆘 Besoin d'aide ?

- Documentation : Voir `VERCEL_DEPLOYMENT.md`
- Issues : https://github.com/Davidb-2107/ncatoolkit-dashboard/issues
- Community : https://skool.com/no-code-architects

Bonne chance avec votre déploiement ! 🚀
