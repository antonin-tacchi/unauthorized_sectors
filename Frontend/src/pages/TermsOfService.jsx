import { Helmet } from "react-helmet-async";

export default function TermsOfService() {
    return (
        <div>
            <Helmet>
                <title>Conditions d'utilisation — Antonin TACCHI</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <h2 className="text-3xl font-bold mb-8">Conditions d'utilisation</h2>
        </div>
    );
}