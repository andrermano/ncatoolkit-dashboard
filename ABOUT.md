# Dashboard Frontend - No-Code Architects Toolkit

Ce dossier contient le **frontend Next.js** pour le No-Code Architects Toolkit API.

## 🎯 Objectif

Ce dashboard est un projet **indépendant** conçu pour être déployé séparément de l'API principale.

## 📦 Contenu

- **Framework:** Next.js 14 avec TypeScript
- **Styling:** Tailwind CSS
- **Features:** Conversion média, transcription, interface moderne
- **Sécurité:** Proxy backend pour cacher la clé API

## 🚀 Utilisation

### Option 1 : Déployer ce dossier directement

```bash
cd dashboard
npm install
npm run dev
```

### Option 2 : Transférer vers un nouveau repo

Ce dossier est prêt à être transféré vers un repo Git séparé :

```bash
# 1. Créer un nouveau repo sur GitHub (ex: ncatoolkit-dashboard)

# 2. Sur votre machine locale
git clone --single-branch --branch claude/dashboard-ui-01HBuuUJfCZx2ENTZ76a8ieY \
  https://github.com/Davidb-2107/no-code-architects-toolkit.git temp-dashboard

cd temp-dashboard/dashboard

# 3. Initialiser un nouveau repo
git init
git add .
git commit -m "Initial commit: Dashboard from toolkit repo"

# 4. Pousser vers le nouveau repo
git remote add origin https://github.com/Davidb-2107/ncatoolkit-dashboard.git
git branch -M main
git push -u origin main
```

### Option 3 : Déployer directement sur Vercel

1. Aller sur https://vercel.com/new
2. Importer ce repo : `Davidb-2107/no-code-architects-toolkit`
3. Sélectionner la branche : `claude/dashboard-ui-01HBuuUJfCZx2ENTZ76a8ieY`
4. Définir le **Root Directory** : `dashboard`
5. Ajouter les variables d'environnement :
   - `TOOLKIT_API_URL`
   - `TOOLKIT_API_KEY`
6. Déployer !

## 📚 Documentation

- `README.md` - Documentation complète du dashboard
- `VERCEL_DEPLOYMENT.md` - Guide de déploiement Vercel détaillé
- `QUICKSTART.md` - Guide de démarrage rapide
- `deploy.sh` - Script de déploiement automatisé

## 🔗 Repos

- **API Backend:** https://github.com/Davidb-2107/no-code-architects-toolkit
- **Dashboard Frontend:** (à créer) https://github.com/Davidb-2107/ncatoolkit-dashboard

## 📋 Variables d'environnement requises

```env
TOOLKIT_API_URL=https://your-api-url.com
TOOLKIT_API_KEY=your_api_key_here
```

---

**Note:** Ce dossier contient un projet Next.js complet et indépendant.
Il peut être déployé séparément de l'API principale.
