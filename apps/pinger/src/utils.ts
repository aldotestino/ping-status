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
        if (ping.success) {
          acc.incidentsToClose.push(relatedIncident.id);
        }
      } else if (!ping.success) {
        acc.incidentsToOpen.push(ping.monitorName);
      }

      return acc;
    },
    {
      incidentsToOpen: [],
      incidentsToClose: [],
    } as {
      incidentsToOpen: string[];
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
