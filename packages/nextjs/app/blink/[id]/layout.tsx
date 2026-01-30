import { Metadata } from "next";

export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }>
}): Promise<Metadata> {
    const { id: offerId } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

    return {
        title: `VeriFi Loan Offer #${offerId}`,
        description: "Privacy-preserving P2P lending with Zero-Knowledge Proofs. Prove your creditworthiness without revealing financial data.",
        openGraph: {
            title: `VeriFi Loan Offer #${offerId}`,
            description: "Privacy-preserving P2P lending with Zero-Knowledge Proofs",
            type: "website",
            url: `${baseUrl}/blink/${offerId}`,
            images: [
                {
                    url: `${baseUrl}/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: "VeriFi ZK Lending",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `VeriFi Loan Offer #${offerId}`,
            description: "Privacy-preserving P2P lending with Zero-Knowledge Proofs",
            images: [`${baseUrl}/og-image.png`],
        },
        other: {
            // Actions API metadata for Solana Blinks / dial.to
            "actions:version": "2.0",
            "actions:icon": `${baseUrl}/verifi-icon.svg`,
            "actions:title": `VeriFi Loan Offer #${offerId}`,
            "actions:description": "Privacy-preserving P2P lending with Zero-Knowledge Proofs",
            "actions:label": "Check Eligibility",
            "actions:post": `${baseUrl}/api/actions/${offerId}`,
        },
    };
}

export { default } from "./page";
