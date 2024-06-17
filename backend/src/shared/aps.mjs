import { SdkManagerBuilder } from "@aps_sdk/autodesk-sdkmanager";
import { AuthenticationClient, Scopes } from "@aps_sdk/authentication";
import { OssClient, CreateBucketXAdsRegionEnum, CreateBucketsPayloadPolicyKeyEnum } from "@aps_sdk/oss";
import { ModelDerivativeClient, View, Type } from "@aps_sdk/model-derivative";

const PUBLIC_SCOPES = [Scopes.ViewablesRead];
const INTERNAL_SCOPES = [Scopes.BucketRead, Scopes.BucketCreate, Scopes.DataCreate, Scopes.DataWrite, Scopes.DataRead];

const sdk = SdkManagerBuilder.create().build();
const authenticationClient = new AuthenticationClient(sdk);
const ossClient = new OssClient(sdk);
const modelDerivativeClient = new ModelDerivativeClient(sdk);

export async function getPublicAccessToken(clientId, clientSecret) {
    const credentials = await authenticationClient.getTwoLeggedToken(clientId, clientSecret, PUBLIC_SCOPES);
    return credentials;
}

export async function getInternalAccessToken(clientId, clientSecret) {
    const credentials = await authenticationClient.getTwoLeggedToken(clientId, clientSecret, INTERNAL_SCOPES);
    return credentials;
}

export async function ensureBucketExists(bucketKey, accessToken) {
    try {
        await ossClient.getBucketDetails(accessToken, bucketKey);
    } catch (err) {
        if (err.axiosError.response.status === 404) {
            await ossClient.createBucket(accessToken, CreateBucketXAdsRegionEnum.Us, {
                bucketKey: bucketKey,
                policyKey: CreateBucketsPayloadPolicyKeyEnum.Persistent
            });
        } else {
            throw err;  
        }
    }
}

export async function listObjects(bucketKey, accessToken) {
    let resp = await ossClient.getObjects(accessToken, bucketKey, { limit: 64 });
    let objects = resp.items;
    while (resp.next) {
        const startAt = new URL(resp.next).searchParams.get("startAt");
        resp = await ossClient.getObjects(accessToken, bucketKey, { limit: 64, startAt });
        objects = objects.concat(resp.items);
    }
    return objects;
}

export function urnify(id) {
    return Buffer.from(id).toString("base64").replace(/=/g, "");
}

export async function createUploadURL(bucketKey, objectKey, accessToken) {
    const signedUrl = await ossClient.createSignedResource(accessToken, bucketKey, objectKey, { access: "write" });
    return signedUrl.signedUrl;
}

export async function getDerivativeManifest(urn, accessToken) {
    try {
        const manifest = await modelDerivativeClient.getManifest(accessToken, urn);
        return manifest
    } catch (err) {
        if (err.axiosError.response.status === 404) {
            return null;
        } else {
            throw err;
        }
    }
}

export async function startDerivativeConversion(urn, accessToken) {
    const job = await modelDerivativeClient.startJob(accessToken, {
        input: {
            urn
        },
        output: {
            formats: [{
                views: [View._2d, View._3d],
                type: Type.Svf2
            }]
        }
    });
    return job.result;
}
