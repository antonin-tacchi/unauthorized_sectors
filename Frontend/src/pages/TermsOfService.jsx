import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

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

export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Helmet>
        <title>Conditions d'utilisation — Antonin TACCHI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-10">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition">← Accueil</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white/90">Conditions d'utilisation</h1>
        <p className="mt-2 text-sm text-white/40">Dernière mise à jour : 17 mars 2026</p>
      </div>

      <Section title="1. Objet">
        <p>
          Les présentes conditions d'utilisation régissent l'accès et l'utilisation du site
          <strong className="text-white/80"> antonin-tacchi.com</strong>, portfolio et plateforme de
          commissions de mapping FiveM exploité par Antonin TACCHI (ci-après "le Prestataire").
        </p>
        <p>
          En accédant au site ou en soumettant une demande de commission, vous acceptez sans réserve
          les présentes conditions.
        </p>
      </Section>

      <Section title="2. Services proposés">
        <p>Le site propose les services suivants :</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>Consultation du portfolio de travaux de mapping FiveM (MLO, Exterior, YMAP…)</li>
          <li>Demandes de commissions de mapping personnalisé via le formulaire de contact</li>
          <li>Accès à un serveur Discord communautaire via intégration OAuth2</li>
        </ul>
      </Section>

      <Section title="3. Commissions — conditions spécifiques">
        <p><strong className="text-white/70">3.1 Processus de commande</strong></p>
        <p>
          Toute commission débute par une demande via le formulaire de contact. Le Prestataire se
          réserve le droit d'accepter ou refuser toute demande sans avoir à se justifier.
        </p>
        <p><strong className="text-white/70">3.2 Devis et paiement</strong></p>
        <p>
          Un devis personnalisé est établi après étude de la demande. Un acompte peut être demandé
          avant le démarrage des travaux. Le solde est dû à la livraison.
        </p>
        <p><strong className="text-white/70">3.3 Livraison et révisions</strong></p>
        <p>
          Les délais de livraison sont indicatifs et communiqués lors du devis. Le nombre de révisions
          incluses est précisé dans le devis. Des révisions supplémentaires peuvent être facturées.
        </p>
        <p><strong className="text-white/70">3.4 Propriété intellectuelle des travaux commandés</strong></p>
        <p>
          À réception du paiement intégral, le client obtient une <strong className="text-white/70">licence d'utilisation
          non-exclusive</strong> sur le travail livré, dans le cadre d'une utilisation sur serveur FiveM privé.
          Toute revente, redistribution ou publication des fichiers livrés est strictement interdite sans
          accord écrit préalable.
        </p>
      </Section>

      <Section title="4. Comportement de l'utilisateur">
        <p>Il est interdit d'utiliser ce site pour :</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>Toute activité illégale ou frauduleuse</li>
          <li>Envoyer des contenus offensants, diffamatoires ou abusifs via les formulaires</li>
          <li>Tenter d'accéder aux parties administratives sans autorisation</li>
          <li>Scraper ou reproduire le contenu du portfolio sans autorisation</li>
        </ul>
      </Section>

      <Section title="5. Limitation de responsabilité">
        <p>
          Le Prestataire ne saurait être tenu responsable des dommages indirects liés à l'utilisation
          du site ou des travaux livrés. La responsabilité totale du Prestataire est limitée au montant
          payé pour la commission concernée.
        </p>
        <p>
          Le Prestataire ne garantit pas la compatibilité des travaux livrés avec les futures mises à
          jour de FiveM ou des serveurs tiers.
        </p>
      </Section>

      <Section title="6. Modification des conditions">
        <p>
          Le Prestataire se réserve le droit de modifier les présentes conditions à tout moment.
          Les conditions applicables sont celles en vigueur à la date de la demande de commission.
        </p>
      </Section>

      <Section title="7. Droit applicable et juridiction">
        <p>
          Les présentes conditions sont soumises au <strong className="text-white/70">droit français</strong>.
          Tout litige sera soumis aux tribunaux compétents du ressort de la résidence du Prestataire,
          après tentative de résolution amiable.
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/legal-notices" className="hover:text-white/60 transition">Mentions légales</Link>
        <Link to="/privacy-policy" className="hover:text-white/60 transition">Politique de confidentialité</Link>
      </div>
    </div>
  );
}
