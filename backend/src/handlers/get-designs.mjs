import assert from "assert";
import process from "process";
import { getInternalAccessToken, ensureBucketExists, listObjects, urnify } from "../shared/aps.mjs";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Headers" : "Content-Type", // TODO: is there a way to set these headers in template.yaml?
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export async function getDesigns(event) {
    try {
        const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;
        assert(!!APS_CLIENT_ID, "Missing APS_CLIENT_ID environment variable.");
        assert(!!APS_CLIENT_SECRET, "Missing APS_CLIENT_SECRET environment variable.");
        assert(event.httpMethod === "GET", "Only GET requests are allowed for this endpoint.");
        const credentials = await getInternalAccessToken(APS_CLIENT_ID, APS_CLIENT_SECRET);
        const bucketKey = APS_CLIENT_ID.toLowerCase() + "-test-bucket";
        await ensureBucketExists(bucketKey, credentials.access_token);
        const objects = await listObjects(bucketKey, credentials.access_token);
        return {
            statusCode: 200,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(objects.map(obj => ({
                name: obj.objectKey,
                urn: urnify(obj.objectId)
            })))
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
