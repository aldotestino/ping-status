import type { Incident, PingResult } from "@ping-status/db/schema";
import { formatDistance } from "date-fns";

export type OpenIncident = Incident &
  Pick<PingResult, "statusCode" | "responseTime" | "message">;

const tableCell = (
  text: string,
  options:
    | {
        type: "header" | "text";
      }
    | {
        type: "link";
        url: string;
      }
) => ({
  type: "rich_text",
  elements: [
    {
      type: "rich_text_section",
      elements: [
        options.type === "link"
          ? {
              type: "link",
              url: options.url,
              text,
            }
          : {
              type: "text",
              text,
              style: {
                bold: options.type === "header",
              },
            },
      ],
    },
  ],
});

const tableHeaderCell = (text: string) => tableCell(text, { type: "header" });
const tableLinkCell = (text: string, url: string) =>
  tableCell(text, { type: "link", url });

type TableCell = ReturnType<typeof tableCell>;

const header = (text: string) => ({
  type: "header",
  text: {
    type: "plain_text",
    text,
    emoji: true,
  },
});

const table = (headerStrings: string[], rows: (string | TableCell)[][]) => ({
  type: "table",
  rows: [
    headerStrings.map(tableHeaderCell),
    ...rows.map((row) =>
      row.map((v) =>
        typeof v === "string" ? tableCell(v, { type: "text" }) : v
      )
    ),
  ],
});

export function formatOpenIncidentsMessage(incidents: OpenIncident[]) {
  return {
    blocks: [
      header(`🔴 Service Health Alert - ${incidents.length} incidents opened`),
      table(
        ["Service Name", "#ID", "Status", "Status Code", "Message"],
        incidents.map((i) => [
          i.monitorName,
          tableLinkCell(
            `#${i.id}`,
            `https://status.usealbatross.ai/aldo2025/requests?incidentId=${i.id}`
          ),
          i.type === "down" ? "🔴 Down" : "🟡 Degraded",
          `${i.statusCode || "-"}`,
          i.message || "-",
        ])
      ),
    ],
  };
}

export function formatClosedIncidentsMessage(incidents: Incident[]) {
  return {
    blocks: [
      header(`🟢 Service Health Alert - ${incidents.length} incidents closed`),
      table(
        ["Service Name", "#ID", "Status", "Duration"],
        incidents.map((i) => [
          i.monitorName,
          tableLinkCell(
            `#${i.id}`,
            `https://status.usealbatross.ai/aldo2025/requests?incidentId=${i.id}`
          ),
          "🟢 Operational",
          formatDistance(i.closedAt || new Date(), i.openedAt),
        ])
      ),
    ],
  };
}
