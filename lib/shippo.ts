import { Shippo } from "shippo"

export const shippo = new Shippo({ apiKeyHeader: 'ShippoToken ' + process.env.SHIPPO_KEY });
