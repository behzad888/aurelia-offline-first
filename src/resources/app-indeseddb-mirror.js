// import { Configuration } from './configuration';
import { computedFrom } from 'aurelia-framework';
import { AppStorageBehavior } from './app-storage-behavior';
import { AppIdexedDBMirrorWorker } from './app-indexeddb-mirror-worker';
export class AppIndexedDBMirror extends AppStorageBehavior {
    key = 'todos'
    /**
     * Any string value that uniquely identifies the current session.
     * Whenever this value changes, the data stored at `key` will be
     * deleted. This is useful for handling scenarios such as user
     * session changes (e.g., logout).
     */
    session = 'Gmkz35NWIgcrxlyxZFcdux9kmPI2'
    /**
     * A URL that points to the script to load for the corresponding
     * Worker instance that will be used for minimally-blocking operations
     * on IndexedDB.
     *
     * By default, this will be the path to
     * `app-indexeddb-mirror-worker.js` as resolved by
     * `Polymer.Base.resolveUrl` for the current element being created.
     */
    workerUrl = '/dist/resources/app-indexeddb-mirror-worker.js'
    /**
     * An instance of `Polymer.AppIndexedDBMirrorClient`, which is
     * responsible for negotiating transactions with the corresponding
     * Worker spawned from `workerUrl`.
     */
    client = new AppIdexedDBMirrorWorker('practicalaurelia', 'todos')
    /*
     * When online, this property is a pass-through value mapped directly
     * to the `data` property of this element.
     *
     * When offline, this property is a read-only copy of the `data` that
     * has been stored in the IndexedDB database at `key`.
     */
    persistedData = {
        type: Object,
        notify: true
    }

    get isNew() {
        return false;
    }

    destroy() {
        return this.client.transaction('set', this.key, null);
    }

    /** @override */
    setStoredValue(path, value) {
        if (this.online) {
            return this.client.transaction('set', path, value);
        }
        return Promise.resolve();
    }

    /** @override */
    getStoredValue(path) {
        return this.client.transaction('get', this.key);
    }

    /** @override */
    initializeStoredValue() {
        return Promise.resolve();
    }

    __clientChanged(client) {
        this._enqueueTransaction(function () {
            return client.connect();
        });
    }
    @computedFrom('__clientChanged')
    get __computeClient() {
        return new AppIndexedDBMirrorClient(this.workerUrl);
    }
    @computedFrom('data')
    get __updatePersistedData() {
        this._log('Updating persisted data..');
        this._enqueueTransaction(function () {
            return this.client.validateSession(this.session);
        });
        if (this.online) {
            this.persistedData = this.data;
            // this.linkPaths('data', 'persistedData');
        } else {
            // this.unlinkPaths('data', 'persistedData');
            this._enqueueTransaction(function () {
                return this.getStoredValue().then(function (value) {
                    // We may have gone online since retrieving the persisted value..
                    if (this.online || !this.client.supportsMirroring) {
                        return;
                    }
                    this.persistedData = value;
                }.bind(this));
            });
        }
    }
}