import { useRef, useEffect } from "react";

let _runtime = { options: null, promise: null };

function Viewer({ urn, runtime }) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    function initRuntime(options) {
        if (!_runtime.promise) {
            _runtime.options = options || {};
            _runtime.promise = new Promise((resolve, reject) => {
                Autodesk.Viewing.Initializer(_runtime.options, resolve);
            });
        } else {
            for (const prop of Object.getOwnPropertyNames(_runtime.options)) {
                if (_runtime.options[prop] !== options[prop]) {
                    throw new Error("Viewer runtime properties cannot be modified after the runtime has been initialized.");
                }
            }
        }
        return _runtime.promise;
    }

    function loadModel(viewer, urn) {
        Autodesk.Viewing.Document.load(
            "urn:" + urn,
            doc => viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry()),
            (code, message) => console.error(code, message)
        );
    }

    useEffect(() => {
        initRuntime(runtime).then(() => {
            const viewer = new Autodesk.Viewing.GuiViewer3D(containerRef.current);
            viewer.start();
            if (urn && urn.length > 0) {
                loadModel(viewer, urn);
            }
            viewerRef.current = viewer;
        });
        return () => {
            if (viewerRef.current) {
                viewerRef.current.finish();
                viewerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (viewerRef.current && urn && urn.length > 0) {
            loadModel(viewerRef.current, urn);
        }
    }, [urn]);

    return <div ref={containerRef}></div>;
}

export default Viewer;
