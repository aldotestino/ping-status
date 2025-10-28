CREATE TABLE `incident` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitorName` text NOT NULL,
	`type` text NOT NULL,
	`openedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`closedAt` integer
);
--> statement-breakpoint
CREATE INDEX `incident_monitorName_idx` ON `incident` (`monitorName`);--> statement-breakpoint
CREATE TABLE `pingResult` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitorName` text NOT NULL,
	`status` text NOT NULL,
	`message` text,
	`responseTime` integer NOT NULL,
	`statusCode` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`incidentId` integer,
	FOREIGN KEY (`incidentId`) REFERENCES `incident`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pingResult_monitorName_idx` ON `pingResult` (`monitorName`);