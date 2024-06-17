import { initViewer, loadModel } from "./viewer.js";
import { API_ENDPOINT } from "./config.js";

const urn = window.location.hash?.substring(1);
const viewer = await initViewer(document.getElementById("preview"), `${API_ENDPOINT}token`);
setupModelSelection(viewer, urn);
setupModelUpload(viewer);

async function setupModelSelection(viewer, selectedUrn) {
    const dropdown = document.getElementById("models");
    dropdown.innerHTML = "";
    try {
        const resp = await fetch(`${API_ENDPOINT}designs`);
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const models = await resp.json();
        dropdown.innerHTML = models.map(model => `<option value=${model.urn} ${model.urn === selectedUrn ? "selected" : ""}>${model.name}</option>`).join("\n");
        dropdown.onchange = () => onModelSelected(viewer, dropdown.value);
        if (dropdown.value) {
            onModelSelected(viewer, dropdown.value);
        }
    } catch (err) {
        console.error(err);
        alert("Could not list models. See the console for more details.");
    }
}

async function setupModelUpload(viewer) {
    const upload = document.getElementById("upload");
    const input = document.getElementById("input");
    const models = document.getElementById("models");
    upload.onclick = () => input.click();
    input.onchange = async () => {
        /** @type File */
        const file = input.files[0];
        upload.setAttribute("disabled", "true");
        models.setAttribute("disabled", "true");
        console.log(`Uploading model <code>${file.name}</code>. Do not reload the page.`);
        try {
            // Create a design & get an upload URL
            let resp = await fetch(`${API_ENDPOINT}designs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: file.name })
            });
            if (!resp.ok) {
                throw new Error(await resp.text());
            }
            const { url } = await resp.json();
            // Upload file
            const buffer = await file.arrayBuffer();
            resp = await fetch(url, { method: "PUT", body: buffer });
            if (!resp.ok) {
                throw new Error(await resp.text());
            }
            // Update UI
            setupModelSelection(viewer);
        } catch (err) {
            alert(`Could not upload model ${file.name}. See the console for more details.`);
            console.error(err);
        } finally {
            upload.removeAttribute("disabled");
            models.removeAttribute("disabled");
            input.value = "";
        }
    };
}

async function onModelSelected(viewer, urn) {
    window.location.hash = urn;
    try {
        const resp = await fetch(`${API_ENDPOINT}designs/${urn}/status`);
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const status = await resp.json();
        switch (status.status) {
            case "inprogress":
                console.log(`Model is being translated (${status.progress})...`);
                break;
            case "failed":
                console.log(`Translation failed. <ul>${status.messages.map(msg => `<li>${JSON.stringify(msg)}</li>`).join("")}</ul>`);
                break;
            default:
                loadModel(viewer, urn);
                break; 
        }
    } catch (err) {
        alert("Could not load model. See the console for more details.");
        console.error(err);
    }
}
