import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-white/90 border-b border-white/10 pb-2 mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-white/60 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Helmet>
        <title>Politique de confidentialité — Antonin TACCHI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-10">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition">{t("legal.backHome")}</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white/90">{t("legal.privacyTitle")}</h1>
        <p className="mt-2 text-sm text-white/40">{t("legal.lastUpdated")}</p>
      </div>

      <Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles collectées sur ce site est
          Antonin TACCHI, joignable à l'adresse : <strong className="text-white/80">antonin.tacchi2005@gmail.com</strong>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Ce site collecte les données personnelles suivantes :</p>
        <ul className="space-y-2 pl-4 list-disc list-inside marker:text-white/20">
          <li>
            <strong className="text-white/70">Formulaire de contact / commande :</strong> prénom, adresse email,
            objet de la demande, budget, description du projet. Ces données sont transmises via Discord Webhook
            et stockées temporairement dans notre base de données.
          </li>
          <li>
            <strong className="text-white/70">Connexion Discord OAuth2 :</strong> identifiant Discord,
            nom d'utilisateur Discord (si vous utilisez le bouton "Connect with Discord"). Ces données
            sont utilisées uniquement pour vous ajouter au serveur Discord.
          </li>
          <li>
            <strong className="text-white/70">Données de navigation :</strong> adresse IP, navigateur,
            pages visitées (collectées par l'hébergeur à des fins de sécurité et de statistiques).
          </li>
        </ul>
      </Section>

      <Section title="3. Base légale du traitement">
        <p>Le traitement de vos données repose sur :</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>Votre <strong className="text-white/70">consentement</strong> lors de la soumission du formulaire</li>
          <li>L'<strong className="text-white/70">intérêt légitime</strong> pour répondre à vos demandes</li>
          <li>L'<strong className="text-white/70">exécution d'un contrat</strong> dans le cadre d'une commission</li>
        </ul>
      </Section>

      <Section title="4. Durée de conservation">
        <p>
          Les données du formulaire de contact sont conservées pendant la durée nécessaire au traitement
          de votre demande, et au maximum <strong className="text-white/70">3 ans</strong> à compter du
          dernier contact.
        </p>
        <p>
          Les données Discord sont uniquement utilisées lors de la connexion OAuth2 et ne sont pas
          stockées de façon permanente sur nos serveurs au-delà du ticket associé.
        </p>
      </Section>

      <Section title="5. Partage des données">
        <p>Vos données personnelles ne sont pas vendues ni cédées à des tiers. Elles peuvent être
        transmises aux sous-traitants techniques suivants, dans le strict cadre de leur mission :</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>Railway Corp (hébergement API)</li>
          <li>Discord Inc (intégration OAuth2 et tickets)</li>
          <li>Cloudinary (hébergement des médias)</li>
        </ul>
      </Section>

      <Section title="6. Vos droits">
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des
          droits suivants concernant vos données personnelles :
        </p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>Droit d'<strong className="text-white/70">accès</strong> à vos données</li>
          <li>Droit de <strong className="text-white/70">rectification</strong></li>
          <li>Droit à l'<strong className="text-white/70">effacement</strong> ("droit à l'oubli")</li>
          <li>Droit à la <strong className="text-white/70">limitation</strong> du traitement</li>
          <li>Droit à la <strong className="text-white/70">portabilité</strong> de vos données</li>
          <li>Droit d'<strong className="text-white/70">opposition</strong> au traitement</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à <strong className="text-white/80">antonin.tacchi2005@gmail.com</strong>.
          Vous pouvez également introduire une réclamation auprès de la CNIL (Commission Nationale de
          l'Informatique et des Libertés) sur <strong className="text-white/70">cnil.fr</strong>.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Ce site utilise uniquement un cookie technique <strong className="text-white/70">httpOnly</strong> de
          session administrateur (refresh_token), qui n'est actif que lorsque vous êtes connecté à
          l'espace admin. Aucun cookie de tracking ou publicitaire n'est utilisé.
        </p>
        <p>
          Les favoris projets sont stockés dans le <strong className="text-white/70">localStorage</strong> de
          votre navigateur, sans transmission vers nos serveurs.
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/legal-notices" className="hover:text-white/60 transition">{t("footer.legal")}</Link>
        <Link to="/terms-of-service" className="hover:text-white/60 transition">{t("footer.terms")}</Link>
      </div>
    </div>
  );
}
