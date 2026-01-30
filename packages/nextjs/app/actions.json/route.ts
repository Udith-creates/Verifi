import { NextResponse } from "next/server";

export async function GET() {
    const actionsJson = {
        rules: [
            {
                pathPattern: "/blink/*",
                apiPath: "/api/actions/*",
            },
        ],
    };

    return NextResponse.json(actionsJson, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
