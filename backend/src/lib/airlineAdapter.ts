import sg from "@sendgrid/mail";
import { Order, Bag } from "@prisma/client";

sg.setApiKey(process.env.SENDGRID_API_KEY!);

const airlineEmails: Record<string, string> = {
  AA: "aa.manifests+dev@bag2go.dev",
  DL: "dl.manifests+dev@bag2go.dev",
  UA: "ua.manifests+dev@bag2go.dev",
  default: "ops@bag2go.dev",
};

interface Row {
  bagTag: string;
  weightKg: number;
  passenger: string;
}

export async function sendManifest(order: Order & { bags: Bag[] }) {
  const rows: Row[] = order.bags.map((b) => ({
    bagTag: b.tagNumber,
    weightKg: b.weightKg,
    passenger: order.userId ?? "Unknown",
  }));

  const to = airlineEmails[order.airlineCode] || airlineEmails.default;
  const msg = {
    to,
    from: process.env.SENDGRID_FROM!,
    subject: `Bag 2 Go manifest – ${order.airlineCode} ${order.flightNumber}`,
    text: "Attached is the baggage manifest.",
    attachments: [
      {
        content: Buffer.from(JSON.stringify(rows, null, 2)).toString("base64"),
        filename: `manifest-${order.id}.json`,
        type: "application/json",
        disposition: "attachment",
      },
    ],
    mailSettings: { sandboxMode: { enable: process.env.NODE_ENV !== "production" } },
  };  

  const [res] = await sg.send(msg);
  return res.headers["x-message-id"] as string | undefined;
}
