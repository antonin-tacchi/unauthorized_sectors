import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
    return (
        <div>
            <Helmet>
                <title>Politique de confidentialité — Antonin TACCHI</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <h2 className="text-3xl font-bold mb-8">Politique de confidentialité</h2>
        </div>
    );
}