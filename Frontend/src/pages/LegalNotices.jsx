import { Helmet } from "react-helmet-async";

export default function LegalNotices() {
    return (
        <div>
            <Helmet>
                <title>Mentions légales — Antonin TACCHI</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <h2 className="text-3xl font-bold mb-8">Mentions légales</h2>
        </div>
    );
}