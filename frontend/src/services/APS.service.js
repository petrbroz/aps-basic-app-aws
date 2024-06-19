import { API_ENDPOINT } from "../../config.json";

async function _fetch(path, config) {
    const resp = await fetch(API_ENDPOINT.replace(/\/$/, "") + path, config);
    if (!resp.ok) {
        throw new Error(await resp.text());
    }
    const json = await resp.json();
    return json;
}

export async function getAccessToken() {
    return _fetch("/token");
}

export async function getModels() {
    return _fetch("/designs");
}

export async function getModelStatus(urn) {
    return await _fetch(`/designs/${urn}/status`);
}

export async function uploadModel(file) {
    const { url } = await _fetch("/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name })
    });
    const resp = await fetch(url, { method: "PUT", body: await file.arrayBuffer() });
    if (!resp.ok) {
        throw new Error(await resp.text());
    }
}
