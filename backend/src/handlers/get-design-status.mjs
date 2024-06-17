import assert from "assert";
import process from "process";
import { getInternalAccessToken, getDerivativeManifest, startDerivativeConversion } from "../shared/aps.mjs";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Headers" : "Content-Type", // TODO: is there a way to set these headers in template.yaml?
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export async function getDesignStatus(event) {
    try {
        const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;
        assert(!!APS_CLIENT_ID, "Missing APS_CLIENT_ID environment variable.");
        assert(!!APS_CLIENT_SECRET, "Missing APS_CLIENT_SECRET environment variable.");
        assert(event.httpMethod === "GET", "Only GET requests are allowed for this endpoint.");
        const { urn } = event.pathParameters;
        const credentials = await getInternalAccessToken(APS_CLIENT_ID, APS_CLIENT_SECRET);
        let manifest = await getDerivativeManifest(urn, credentials.access_token);
        if (!manifest) { // If there are no derivatives yet, kick off a new conversion process in the background
            await startDerivativeConversion(urn, credentials.access_token);
            manifest = await getDerivativeManifest(urn, credentials.access_token);
        }
        return {
            statusCode: 200,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(manifest)
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
