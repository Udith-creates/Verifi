import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "offers.json");

function readDb() {
    if (!fs.existsSync(dbPath)) {
        return [];
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeDb(data: any[]) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
    const offers = readDb();
    return NextResponse.json(offers);
}

export async function POST(request: Request) {
    const body = await request.json();
    const offers = readDb();

    // Assign a local ID if not present (though we expect chain ID usually, 
    // but for local DB we can just store what we get)
    const newOffer = {
        ...body,
        timestamp: new Date().toISOString()
    };

    offers.push(newOffer);
    writeDb(offers);

    return NextResponse.json(newOffer);
}

export async function PUT(request: Request) {
    // Update offer status (e.g. accepted)
    const body = await request.json();
    const { id, active } = body;

    let offers = readDb();
    offers = offers.map((o: any) => o.id === id ? { ...o, active } : o);
    writeDb(offers);

    return NextResponse.json({ success: true });
}
