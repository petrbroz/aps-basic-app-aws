import assert from "assert";
import process from "process";
import { getPublicAccessToken } from "../shared/aps.mjs";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Headers" : "Content-Type", // TODO: is there a way to set these headers in template.yaml?
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export async function getAccessToken(event) {
    try {
        const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;
        assert(!!APS_CLIENT_ID, "Missing APS_CLIENT_ID environment variable.");
        assert(!!APS_CLIENT_SECRET, "Missing APS_CLIENT_SECRET environment variable.");
        assert(event.httpMethod === "GET", "Only GET requests are allowed for this endpoint.");
        const credentials = await getPublicAccessToken(APS_CLIENT_ID, APS_CLIENT_SECRET);
        return {
            statusCode: 200,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(credentials)
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 400,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ message: err.message })
        };
    }
}
