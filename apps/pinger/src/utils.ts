import type { Incident, InsertPingResult } from "@ping-status/db/schema";

/**
 * Calculate which incidents should be opened and closed based on ping results (pure function)
 */
export const getIncidentOperations = (
  pings: InsertPingResult[],
  currentOpenIncidents: Incident[]
) => {
  return pings.reduce(
    (acc, ping) => {
      const relatedIncident = currentOpenIncidents.find(
        (i) => i.monitorName === ping.monitorName
      );

      if (relatedIncident) {
        if (ping.status === "operational") {
          acc.incidentsToClose.push(relatedIncident.id);
        } else if (ping.status !== relatedIncident.type) {
          acc.incidentsToClose.push(relatedIncident.id);
        }
      } else if (ping.status !== "operational") {
        acc.incidentsToOpen.push({
          monitorName: ping.monitorName,
          type: ping.status,
        });
      }

      return acc;
    },
    {
      incidentsToOpen: [],
      incidentsToClose: [],
    } as {
      incidentsToOpen: Pick<Incident, "monitorName" | "type">[];
      incidentsToClose: number[];
    }
  );
};

/**
 * Link pings with their corresponding incident IDs (pure function)
 */
export const linkPingsWithIncidents = (
  pings: InsertPingResult[],
  incidents: Incident[]
): InsertPingResult[] => {
  return pings.map((ping) => {
    const relatedIncident = incidents.find(
      (i) => i.monitorName === ping.monitorName
    );

    return { ...ping, incidentId: relatedIncident?.id ?? null };
  });
};
