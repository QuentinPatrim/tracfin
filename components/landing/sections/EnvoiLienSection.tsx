// components/landing/sections/EnvoiLienSection.tsx — Section « Fonctionnement »
//
// Le différenciateur produit : le client n'installe rien et ne crée pas de compte.
// Il reçoit un lien et remplit sa fiche sur son téléphone. Le téléphone affiche le
// VRAI formulaire client (/kyc/demo), pas une maquette. En dessous, les quatre
// étapes côté professionnel : c'est une vraie séquence, donc elle est numérotée.

import KycPhonePreview from "@/components/landing/KycPhonePreview";

const STEPS = [
  {
    title: "Créez le dossier",
    text: "Le nom du client, personne physique ou société. Klaris prépare la fiche adaptée.",
  },
  {
    title: "Envoyez le lien",
    text: "Par e-mail ou WhatsApp. Votre client remplit seul, depuis son téléphone.",
  },
  {
    title: "Recevez le niveau de vigilance",
    text: "À la réception, Klaris classe le dossier et range les pièces avec la fiche.",
  },
  {
    title: "Exportez l'attestation",
    text: "Attestation, fiche client et pièces dans une seule archive, prête à être présentée.",
  },
];

export default function EnvoiLienSection() {
  return (
    <section id="how" className="kl-section">
      <div className="kl-wrap">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="kl-display kl-h2">
              Votre client remplit sa fiche en quelques minutes, depuis son téléphone.
            </h2>
            <p className="kl-lede mt-5">
              Vous envoyez un lien sécurisé. Il clique, complète, joint ses pièces. Vous
              recevez le dossier rangé, sans relance ni ressaisie.
            </p>

            <dl className="kl-facts mt-8 max-w-[34rem]">
              <div>
                <dt>Rien à installer</dt>
                <dd>Pas d&apos;application, pas de compte, pas de mot de passe pour votre client.</dd>
              </div>
              <div>
                <dt>Le canal qu&apos;il utilise déjà</dt>
                <dd>Le lien part par e-mail ou WhatsApp depuis votre tableau de bord. Vous pouvez aussi le copier.</dd>
              </div>
              <div>
                <dt>Un lien qui expire</dt>
                <dd>Chaque lien est unique et valable 30 jours.</dd>
              </div>
            </dl>
          </div>

          {/* Le message reçu, puis le vrai formulaire dans le téléphone */}
          <div className="relative mx-auto w-full max-w-[32rem] lg:mx-0 lg:ml-auto">
            <MessageSheet />
            <div className="relative z-10 -mt-6 flex justify-end pr-2 sm:-mt-24 sm:pr-6">
              <KycPhonePreview />
            </div>
          </div>
        </div>

        <ol className="kl-steps mt-16 sm:mt-24">
          {STEPS.map((s) => (
            <li key={s.title} className="kl-step">
              <h3 className="kl-display kl-h3">{s.title}</h3>
              <p className="kl-body mt-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Le message tel que le client le reçoit (exemple fictif). */
function MessageSheet() {
  return (
    <div
      className="kl-sheet w-full max-w-[22rem] p-5"
      style={{ color: "#17123A", boxShadow: "0 1px 0 rgba(23,18,58,0.05), 0 26px 44px -30px rgba(29,21,82,0.50)" }}
      aria-label="Exemple du message reçu par le client"
    >
      <div className="text-[0.78rem]" style={{ color: "#6F6A8A" }}>
        À : camille.rousseau@example.com
      </div>
      <div className="mt-1 text-[0.95rem] font-semibold leading-snug">
        Vérification d&apos;identité pour votre projet
      </div>
      <p className="mt-3 text-[0.86rem] leading-relaxed" style={{ color: "#55506F" }}>
        Bonjour Camille, dans le cadre de votre projet, merci de compléter votre fiche
        en suivant le lien sécurisé ci-dessous.
      </p>
      <div
        className="mt-3 rounded-md px-3 py-2.5 text-[0.82rem] font-semibold"
        style={{ background: "#EEEBFC", color: "#4A36C9" }}
      >
        klaris-app.fr/kyc/Yt8K…aB3z
      </div>
    </div>
  );
}
