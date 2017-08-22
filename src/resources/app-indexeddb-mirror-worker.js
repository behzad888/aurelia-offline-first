import {AppIndexedDBMirrorClient} from './app-indexeddb-mirror-client';
var INTERNAL_STORE_NAME = 'internal';
var DB_VERSION = 2;
var CLIENT_PORTS = '__clientPorts';
var DB_NAME = '__dbName';
var STORE_NAME = '__storeName';
var DB_OPENS = '__dbOpens';

var MIGRATIONS = [
    // v1
    function (context) {
        context.database.createObjectStore(context.storeName);
    },
    // v2
    function (context) {
        context.database.createObjectStore(INTERNAL_STORE_NAME);
    }
];
export class AppIdexedDBMirrorWorker extends AppIndexedDBMirrorClient{


    constructor(_dbName, _storeName) {
        super('/dist/resources/app-indexeddb-mirror-worker.js');
        _dbName = _dbName || 'app-mirror';
        _storeName = _storeName || 'mirrored_data';

        this[DB_NAME] = _dbName;
        this[STORE_NAME] = _storeName;
        // Maybe useful in case we want to notify clients of changes..
        this[CLIENT_PORTS] = new Array;
        this[DB_OPENS] = null;

        this.openDb();

        self.addEventListener(
            'unhandledrejection', function (error) { console.error(error); });
        self.addEventListener(
            'error', function (error) { console.error(error); });

        this.supportsIndexedDB = self.indexedDB != null;
        console.log('AppIndexedDBMirrorWorker started...');

        self.addEventListener('connect', function (event) {
            this.registerClient(event.ports[0])
        });
    };

    openDb() {
        this.__dbOpens = this.__dbOpens || new Promise(function (resolve, reject) {
            console.log('Opening database..');

            var request = indexedDB.open(this[DB_NAME], DB_VERSION);

            request.onupgradeneeded = function (event) {
                console.log('Upgrade needed:', event.oldVersion, '', event.newVersion);
                var context = {
                    database: request.result,
                    storeName: this[STORE_NAME],
                    dbName: this[DB_NAME]
                };

                for (var i = event.oldVersion; i < event.newVersion; ++i) {
                    MIGRATIONS[i] && MIGRATIONS[i].call(this, context);
                }
            }.bind(this);

            request.onsuccess = function () {
                console.log('Database opened.');
                resolve(request.result);
            };
            request.onerror = function () {
                reject(request.error);
            };
        }.bind(this));

        return this.__dbOpens;
    }

    closeDb() {
        if (this.__dbOpens == null) {
            return Promise.resolve();
        }

        return this.openDb().then(function (db) {
            this.__dbOpens = null;
            console.log('Closing database..');
            db.close();
        }.bind(this));
    }
    operateOnStore(operation, storeName, mode) {
        var operationArgs = Array.from(arguments).slice(3);

        return this.openDb().then(function (db) {

            console.log('Store operation:', operation, storeName, mode, operationArgs);

            return new Promise(function (resolve, reject) {
                try {
                    var transaction = db.transaction(storeName, mode);
                    var store = transaction.objectStore(storeName);
                    var request = store[operation].apply(store, operationArgs);
                } catch (e) {
                    return reject(e);
                }

                transaction.oncomplete = function () { resolve(request.result); };
                transaction.onabort = function () { reject(transaction.error); };
            });
        });
    }

    get(storeName, key) {
        return this.operateOnStore('get', storeName, 'readonly', key);
    }

    set(storeName, key, value) {
        return this.operateOnStore('put', storeName, 'readwrite', value, key);
    }

    clear(storeName) {
        return this.operateOnStore('clear', storeName, 'readwrite');
    }

    transaction(method, key, value) {
        value = value || null;

        switch (method) {
            case 'get':
                return this.get(this[STORE_NAME], key);
            case 'set':
                return this.set(this[STORE_NAME], key, value);
        }

        return Promise.reject(new Error('Method not supported: ' + method));
    }

    validateSession(session) {
        return Promise.all([
            this.openDb(),
            this.get(INTERNAL_STORE_NAME, 'session')
        ]).then(function (results) {
            var db = results[0];
            var currentSession = results[1];
            var operations = [];

            if (session !== currentSession) {
                if (currentSession != null) {
                    operations.push(this.clear(this[STORE_NAME]));
                }

                operations.push(this.set(INTERNAL_STORE_NAME, 'session', session));
            }
        }.bind(this));
    }

    registerClient(port) {
        port.addEventListener('message', function (event) {
            this.handleClientMessage(event, port)
        }.bind(this));

        if (!port in this[CLIENT_PORTS]) {
            this[CLIENT_PORTS].push(port);
        }

        port.start();
        port.postMessage({
            type: 'app-mirror-connected',
            supportsIndexedDB: this.supportsIndexedDB
        });

        console.log('New client connected.');
    }

    handleClientMessage(event, port) {
        if (!event.data) {
            return;
        }

        var id = event.data.id;

        switch (event.data.type) {
            case 'app-mirror-close-db':
                this.closeDb().then(function () {
                    port.postMessage({
                        type: 'app-mirror-db-closed',
                        id: id
                    });
                });
            case 'app-mirror-validate-session':
                this.validateSession(event.data.session).then(function () {
                    port.postMessage({
                        type: 'app-mirror-session-validated',
                        id: id
                    });
                });
                break;
            case 'app-mirror-transaction':
                this.transaction(event.data.method, event.data.key, event.data.value)
                    .then(function (result) {
                        port.postMessage({
                            type: 'app-mirror-transaction-result',
                            id: id,
                            result: result
                        });
                    });
                break;
            case 'app-mirror-disconnect':
                var index = this[CLIENT_PORTS].indexOf(port);

                if (index !== -1) {
                    this[CLIENT_PORTS].splice(index, 1);
                }
                break;
        }
    }
}