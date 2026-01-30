import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: offerId } = await params;
    const baseUrl = request.nextUrl.origin;

    // Actions API metadata for Solana Blinks
    const metadata = {
        icon: `${baseUrl}/verifi-icon.svg`,
        title: `VeriFi Loan Offer #${offerId}`,
        description: "Privacy-preserving P2P lending with Zero-Knowledge Proofs. Prove your creditworthiness without revealing financial data.",
        label: "Check Eligibility",
        links: {
            actions: [
                {
                    label: "Check Eligibility & Claim",
                    href: `${baseUrl}/api/actions/${offerId}`,
                    parameters: [
                        {
                            name: "income",
                            label: "Annual Income",
                            required: true,
                        },
                        {
                            name: "assets",
                            label: "Total Assets",
                            required: true,
                        },
                        {
                            name: "debt",
                            label: "Total Debt",
                            required: true,
                        },
                    ],
                },
            ],
        },
    };

    return NextResponse.json(metadata, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: offerId } = await params;
    const body = await request.json();

    // For now, return a simple response
    // In a full implementation, this would process the action
    return NextResponse.json(
        {
            message: "Action received. Please use the web interface to complete the transaction.",
            offerId,
            data: body,
        },
        {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        }
    );
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
