import { NextResponse } from "next/server";
import { readFinanceStore, addFinanceTransaction, deleteFinanceTransaction, computeFinanceMetrics } from "@/lib/server-finance-store";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const store = await readFinanceStore();
    const transactions = store.transactions || [];
    const metrics = computeFinanceMetrics(transactions);

    return NextResponse.json({
      success: true,
      transactions,
      metrics,
      updatedAt: store.updatedAt
    });
  } catch (err) {
    console.error("Finance API GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch finance records" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.title || !body.amount) {
      return NextResponse.json(
        { success: false, error: "Title and Amount are required" },
        { status: 400 }
      );
    }

    const saved = await addFinanceTransaction(body);
    const store = await readFinanceStore();
    const metrics = computeFinanceMetrics(store.transactions || []);

    return NextResponse.json({
      success: true,
      transaction: saved,
      transactions: store.transactions,
      metrics
    });
  } catch (err) {
    console.error("Finance API POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save finance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteFinanceTransaction(id);
    const store = await readFinanceStore();
    const metrics = computeFinanceMetrics(store.transactions || []);

    return NextResponse.json({
      success: true,
      deletedId: id,
      transactions: store.transactions,
      metrics
    });
  } catch (err) {
    console.error("Finance API DELETE error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete finance record" },
      { status: 500 }
    );
  }
}
