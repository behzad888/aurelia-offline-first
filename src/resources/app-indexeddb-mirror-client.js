import { CommonWorker } from './common-worker';
import { AppIdexedDBMirrorWorker } from './app-indexeddb-mirror-worker';

var WORKER_URL = '__workerUrl';
var CONNECTS_TO_WORKER = '__connectsToWorker';
var CONNECTED = '__connected';
var MESSAGE_ID = '__messageId';
var SUPPORTS_MIRRORING = '__mirroringSupported';
var worker = null;
export class AppIndexedDBMirrorClient {
    constructor(_workerUrl) {        
        this[WORKER_URL] = _workerUrl;
        this[CONNECTED] = false;
        this[MESSAGE_ID] = 0;
        this[CONNECTS_TO_WORKER] = null;
        this[SUPPORTS_MIRRORING] = null;
        this.connect();
    }

    get supportsMirroring() {
        return this[SUPPORTS_MIRRORING];
    }

    validateSession(session) {
        if (session === undefined) {
            // Ignore session `undefined` conventionally, as it means the session
            // (such as the user ID) has not been initialized yet.
            return;
        }
        return this.post({
            type: 'app-mirror-validate-session',
            session: session
        });
    }

    post(message) {
        return this.connect().then(function (worker) {
            if (!this[SUPPORTS_MIRRORING]) {
                return Promise.resolve({});
            }
            return new Promise(function (resolve) {
                var id = this[MESSAGE_ID]++;
                var port = worker.port;
                port.addEventListener('message', function onMessage(event) {
                    if (event.data && event.data.id === id) {
                        port.removeEventListener('message', onMessage);
                        resolve(event.data.result);
                    }
                });
                message.id = id;
                port.postMessage(message);
            }.bind(this));
        }.bind(this));
    }

    transaction(method, key, value) {
        return this.post({
            type: 'app-mirror-transaction',
            method: method,
            key: key,
            value: value
        });
    }

    closeDb() {
        return this.post({
            type: 'app-mirror-close-db'
        });
    }

    connect() {
        if (this[CONNECTED] || this[CONNECTS_TO_WORKER]) {
            return this[CONNECTS_TO_WORKER];
        }
        console.log('App IndexedDB Client connecting..');
        return this[CONNECTS_TO_WORKER] = new Promise(function (resolve) {
            var worker = new CommonWorker(this[WORKER_URL]);
            worker.port.addEventListener('message', function (event) {
                if (event.data &&
                    event.data.type === 'app-mirror-connected') {
                    console.log('App IndexedDB Client connected!');
                    this[CONNECTED] = true;
                    this[SUPPORTS_MIRRORING] = event.data.supportsIndexedDB;
                    resolve(worker);
                }
            }.bind(this));
            worker.addEventListener('error', function (error) {
                console.error(error.message || error);
            });
            worker.port.start();
            worker.port.postMessage({
                type: 'app-mirror-connect'
            });
        }.bind(this));
    }
}