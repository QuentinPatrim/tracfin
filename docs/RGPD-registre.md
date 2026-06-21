# Registre des traitements RGPD — Klaris

> **Document interne** (art. 30 RGPD). Ne pas publier sur le site.
> À tenir à jour et à présenter en cas de contrôle CNIL.

**Dernière mise à jour** : 26 mai 2026
**Responsable de traitement** : Klaris — `À COMPLÉTER : prénom nom + SIRET`
**Contact RGPD** : contact@klaris.fr

---

## Vue d'ensemble

Klaris édite un SaaS d'aide à la conformité LCB-FT. Deux types de traitements coexistent :

1. **Traitements pour lesquels Klaris est responsable** (compte pro, facturation)
2. **Traitements pour lesquels Klaris est sous-traitant** (KYC clients finaux des pros)

---

## 1. Gestion des comptes professionnels

| Champ | Valeur |
|---|---|
| Nom du traitement | Gestion des comptes utilisateurs professionnels |
| Finalité | Authentification, gestion du contrat d'abonnement, support |
| Base légale | Art. 6.1.b RGPD — exécution du contrat |
| Personnes concernées | Professionnels assujettis LCB-FT (clients de Klaris) |
| Catégories de données | Email, nom, prénom, cabinet, profession, mot de passe haché, métadonnées de session |
| Destinataires | Klaris (interne), Clerk Inc. (sous-traitant auth) |
| Transferts hors UE | Oui (Clerk US) — Clauses Contractuelles Types + Data Privacy Framework |
| Durée de conservation | Durée du compte + 30 jours après résiliation |
| Mesures de sécurité | TLS 1.3, mots de passe hachés bcrypt/argon2, isolation logique par tenant |

## 2. Gestion des abonnements et paiements

| Champ | Valeur |
|---|---|
| Nom du traitement | Facturation et encaissement d'abonnements |
| Finalité | Souscription, paiement, comptabilité, fiscalité |
| Base légale | Art. 6.1.b (contrat) + Art. 6.1.c (obligation légale comptable) |
| Personnes concernées | Professionnels abonnés |
| Catégories de données | Identité, adresse, email, données de facturation, historique de paiements |
| Destinataires | Klaris, Stripe Payments Europe Ltd. |
| Transferts hors UE | Non (Stripe traitement EU à Dublin) |
| Durée de conservation | 10 ans (art. L.123-22 Code de commerce) |
| Mesures de sécurité | Stripe PCI-DSS niveau 1, aucune donnée carte ne transite par Klaris |

## 3. Données KYC des clients finaux (en qualité de sous-traitant)

| Champ | Valeur |
|---|---|
| Nom du traitement | Stockage et traitement des dossiers KYC LCB-FT |
| Finalité | Permettre au pro responsable d'exécuter ses obligations LCB-FT |
| Base légale | Obligation légale du pro (art. L.561-5 et s. CMF) — Klaris sous-traite |
| Personnes concernées | Clients finaux des professionnels (personnes physiques et représentants légaux de personnes morales) |
| Catégories de données | Identité, pièces d'identité (CNI, passeport), justificatif de domicile, justificatif de revenus, origine des fonds, exposition PPE, scoring algorithmique |
| Destinataires | Pro utilisateur (responsable), Klaris (sous-traitant), Neon (stockage structuré), Scaleway (pièces) |
| Transferts hors UE | **Non** — Neon Frankfurt 🇩🇪, Scaleway Paris 🇫🇷. Tous dans l'UE. |
| Durée de conservation | 5 ans après fin de la relation d'affaires (art. L.561-12-1 CMF) |
| Mesures de sécurité | TLS 1.3, AES-256 at-rest, scoping par dossier, accès admin journalisé, journal d'audit horodaté de toutes les actions |

### 3a. Sous-traitances PRÉVUES (à activer — pas encore en service)

> ⚠️ **Statut : inactif.** Ces intégrations sont développées mais **non activées** (aucune clé API posée → aucune donnée transmise). À mettre en service uniquement après création de l'entité juridique, signature du DPA, et ajout à la liste publique des sous-traitants. Tant qu'elles sont inactives, aucune donnée ne sort vers ces tiers.

| Sous-traitance prévue | Données qui seront transmises | Finalité | Pré-requis activation |
|---|---|---|---|
| **Criblage sanctions (OpenSanctions, 🇩🇪)** | Nom, date de naissance, nationalité | Vérification contre listes DGT/UE/ONU/OFAC (L.561-10) | DPA + clé API + ajout liste publique |
| **Pré-remplissage entreprise (Pappers, 🇫🇷)** | Numéro SIREN | Récupération RNE/INPI (KYC personnes morales) | DPA + clé API + ajout liste publique |
| **Signature électronique (Yousign, 🇫🇷)** | Attestation + identité/email du signataire | Signature eIDAS opposable | DPA + clé API + ajout liste publique |

> **Flux CRM configurés par le client** : si un professionnel connecte son propre CRM (webhooks), Klaris transmet à l'URL qu'il configure les changements de statut des dossiers. Ce destinataire est choisi par le client, qui en est alors **responsable de traitement** ; Klaris agit sur instruction. Appels signés (HMAC).

## 4. Logs techniques

| Champ | Valeur |
|---|---|
| Nom du traitement | Journalisation technique et sécurité |
| Finalité | Détection d'anomalies, debugging, lutte contre la fraude |
| Base légale | Art. 6.1.f — intérêt légitime (sécurité) |
| Personnes concernées | Utilisateurs du Service |
| Catégories de données | IP, user agent, horodatage, route appelée, code HTTP |
| Destinataires | Klaris, Vercel (hébergeur) |
| Transferts hors UE | Logs Vercel : runtime EU forcé (cdg1) |
| Durée de conservation | 12 mois maximum (recommandation CNIL) |
| Mesures de sécurité | Accès admin uniquement, pas de log de contenu sensible (KYC) |

## 5. Cookies de session

| Champ | Valeur |
|---|---|
| Nom du traitement | Cookies strictement nécessaires |
| Finalité | Maintien de session, sécurisation paiement |
| Base légale | Exemption art. 82 LIL (strictement nécessaires) |
| Personnes concernées | Utilisateurs du Service |
| Durée de conservation | Session + 7 jours max (cookies Clerk) |
| Mesures de sécurité | HttpOnly, Secure, SameSite=Lax |

---

## Évaluations d'impact (AIPD / DPIA)

Compte tenu du traitement à grande échelle de données d'identité, d'un **scoring algorithmique de risque** et d'un **criblage automatisé contre des listes de sanctions/PPE** — susceptibles d'entraîner une déclaration TRACFIN et donc des effets juridiques significatifs pour la personne —, une **AIPD est obligatoire** au sens de l'art. 35 RGPD (notamment critères « évaluation/scoring » et « données à caractère hautement personnel »).

**Statut** : `À COMPLÉTER — AIPD à rédiger et tenir à disposition AVANT ouverture commerciale`. Le criblage automatisé (OpenSanctions) et la décision de niveau de vigilance renforcent cette obligation.

Méthodologie recommandée : guide CNIL AIPD + logiciel PIA (open source CNIL).

---

## Sous-traitants — DPA signés

| Sous-traitant | DPA signé | Localisation | Date |
|---|---|---|---|
| Clerk Inc. | `À VÉRIFIER` | US (DPF + SCC) | — |
| Neon Inc. | `À VÉRIFIER` | DE (UE) | — |
| Scaleway S.A.S. | `À VÉRIFIER` | FR (UE) | — |
| Stripe Payments Europe | `À VÉRIFIER` | IE (UE) | — |
| Vercel Inc. | `À VÉRIFIER` | NL (UE) | — |
| OpenSanctions (Open Knowledge) | `À SIGNER` | DE (UE) | — |
| Pappers | `À SIGNER` | FR (UE) | — |
| Yousign SAS | `À SIGNER` | FR (UE) | — |

> Action : télécharger et signer chaque DPA depuis le portail admin du fournisseur. Conserver les PDF dans `docs/dpa/`.
> ⚠️ **OpenSanctions, Pappers et Yousign** sont de nouveaux sous-traitants (mai 2026) : DPA à signer avant ouverture commerciale des fonctionnalités de criblage, pré-remplissage et signature.

---

## Incidents et violations

Procédure :
1. Détection → confirmation
2. Évaluation du risque dans les **24h**
3. Si risque pour les personnes : notification CNIL dans les **72h** (art. 33 RGPD)
4. Si risque élevé : notification aux personnes concernées sans délai (art. 34 RGPD)
5. Documentation interne dans `docs/incidents/`

**Registre des incidents** : aucun à ce jour.

---

## Réexamen périodique

Ce registre doit être :
- Mis à jour à chaque évolution significative (nouveau sous-traitant, nouvelle finalité, changement de durée)
- Revu intégralement au moins **une fois par an**

Prochaine revue prévue : `À PLANIFIER — mai 2027`
