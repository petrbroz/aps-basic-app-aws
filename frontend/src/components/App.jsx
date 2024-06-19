import { useEffect, useState, useRef } from "react";
import Viewer from "./Viewer";
import * as apsService from "../services/APS.service";
import "./App.css";

function App() {
    let [models, setModels] = useState([]);
    let [urn, setUrn] = useState(null);
    let [error, setError] = useState(null);
    let inputRef = useRef(null);

    function getAccessToken(callback) {
        apsService.getAccessToken()
            .then(credentials => callback(credentials.access_token, credentials.expires_in))
            .catch(err => {
                console.error(err);
                setError("Could not get access token.");
            });
    }

    function getModels() {
        apsService.getModels()
            .then(models => {
                setModels(models);
                if (!urn && models.length > 0) {
                    setUrn(models[0].urn);
                }
            })
            .catch(err => {
                console.error(err);
                setError("Could not load models.");
            });
    }

    function uploadModel(file) {
        apsService.uploadModel(file)
            .then(() => {
                getModels();
            })
            .catch(err => {
                console.error(err);
                setError("Could not upload model.");
            });
    }

    function handleButtonClick() {
        inputRef.current.click();
    }

    function handleInputChange() {
        uploadModel(inputRef.current.files[0]);
    }

    useEffect(() => {
        getModels();
    }, []);

    return (
        <>
            <div id="header">
                <img className="logo" src="https://cdn.autodesk.io/logo/black/stacked.png" alt="Autodesk Platform Services" />
                <span className="title">Basic App</span>
                <select onChange={ev => setUrn(ev.target.value)}>
                    { models.map(model => <option key={model.urn} value={model.urn}>{model.name}</option>) }
                </select>
                <button title="Upload New Model" onClick={handleButtonClick}>Upload</button>
                <input style={{ display: "none" }} type="file" ref={inputRef} onChange={handleInputChange}></input>
            </div>
            <div id="content">
                <Viewer urn={urn} runtime={{ env: "AutodeskProduction2", api: "streamingV2", getAccessToken }} />
                {error && <div id="overlay">{error + " See console for more details."}</div>}
            </div>
        </>
    )
}

export default App;
