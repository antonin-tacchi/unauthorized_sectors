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

export default function LegalNotices() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Helmet>
        <title>Mentions légales — Antonin TACCHI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-10">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition">← Accueil</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white/90">Mentions légales</h1>
        <p className="mt-2 text-sm text-white/40">Dernière mise à jour : 17 mars 2026</p>
      </div>

      <Section title="1. Éditeur du site">
        <p>Le site <strong className="text-white/80">antonin-tacchi.com</strong> est édité par :</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li><strong className="text-white/70">Nom :</strong> Antonin TACCHI</li>
          <li><strong className="text-white/70">Statut :</strong> Particulier — créateur freelance</li>
          <li><strong className="text-white/70">Email :</strong> antonin.tacchi2005@gmail.com</li>
          <li><strong className="text-white/70">Localisation :</strong> France</li>
        </ul>
      </Section>

      <Section title="2. Hébergement">
        <p>Le site est hébergé par :</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li><strong className="text-white/70">Frontend :</strong> Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chypre</li>
          <li><strong className="text-white/70">Backend / API :</strong> Railway Corp, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
          <li><strong className="text-white/70">Médias :</strong> Cloudinary Ltd, 3400 Central Expy, Suite 110, Santa Clara, CA 95051, États-Unis</li>
        </ul>
      </Section>

      <Section title="3. Propriété intellectuelle">
        <p>
          L'ensemble du contenu du site (textes, images, modèles 3D, rendus, code source, graphismes)
          est la propriété exclusive d'Antonin TACCHI, sauf mention contraire.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou transmission de tout ou
          partie du contenu, par quelque moyen que ce soit, est strictement interdite sans autorisation
          écrite préalable de l'éditeur.
        </p>
        <p>
          Les travaux présentés dans le portfolio ont été réalisés dans l'univers de GTA V / FiveM.
          GTA V est une marque déposée de Rockstar Games. Ce site n'est pas affilié à Rockstar Games.
        </p>
      </Section>

      <Section title="4. Responsabilité">
        <p>
          Antonin TACCHI s'efforce de maintenir les informations de ce site à jour et exactes.
          Cependant, il ne saurait être tenu responsable des erreurs ou omissions, ni des dommages
          directs ou indirects résultant de l'utilisation du site.
        </p>
        <p>
          Des liens vers des sites tiers peuvent être présents. L'éditeur ne contrôle pas le contenu
          de ces sites et décline toute responsabilité quant à leur contenu.
        </p>
      </Section>

      <Section title="5. Droit applicable">
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les
          tribunaux français seront seuls compétents.
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/privacy-policy" className="hover:text-white/60 transition">Politique de confidentialité</Link>
        <Link to="/terms-of-service" className="hover:text-white/60 transition">Conditions d'utilisation</Link>
      </div>
    </div>
  );
}
