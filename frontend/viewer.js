export function initViewer(container, accessTokenEndpoint) {
    const options = {
        env: "AutodeskProduction2",
        api: "streamingV2",
        getAccessToken: async function (callback) {
            try {
                const resp = await fetch(accessTokenEndpoint);
                if (resp.ok) {
                    const credentials = await resp.json();
                    callback(credentials.access_token, credentials.expires_in);                    
                } else {
                    throw new Error(await resp.text());
                }
            } catch (err) {
                console.error(err);
                alert("Could not obtain access token. See the console for more details.");
            }
        }
    };
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer(options, function () {
            const viewer = new Autodesk.Viewing.GuiViewer3D(container);
            viewer.start();
            viewer.setTheme("light-theme");
            viewer.setEnvMapBackground(false);
            resolve(viewer);
        });
    });
}

export function loadModel(viewer, urn) {
    function onDocumentLoadSuccess(doc) {
        viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
    }
    function onDocumentLoadFailure(code, message, errors) {
        console.error(code, message, errors);
        alert("Could not load design. See the console for more details.");
    }
    Autodesk.Viewing.Document.load("urn:" + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}
