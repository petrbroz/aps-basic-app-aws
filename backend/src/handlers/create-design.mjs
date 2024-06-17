import assert from "assert";
import process from "process";
import { getInternalAccessToken, ensureBucketExists, createUploadURL } from "../shared/aps.mjs";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Headers" : "Content-Type", // TODO: is there a way to set these headers in template.yaml?
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export async function createDesign(event) {
    try {
        const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;
        assert(!!APS_CLIENT_ID, "Missing APS_CLIENT_ID environment variable.");
        assert(!!APS_CLIENT_SECRET, "Missing APS_CLIENT_SECRET environment variable.");
        assert(event.httpMethod === "POST", "Only POST requests are allowed for this endpoint.");
        const { name } = JSON.parse(event.body);
        assert(name, "The 'name' field is missing in the request payload.");
        const credentials = await getInternalAccessToken(APS_CLIENT_ID, APS_CLIENT_SECRET);
        const bucketKey = APS_CLIENT_ID.toLowerCase() + "-test-bucket";
        await ensureBucketExists(bucketKey, credentials.access_token);
        const url = await createUploadURL(bucketKey, name, credentials.access_token);
        return {
            statusCode: 200,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ url })
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
