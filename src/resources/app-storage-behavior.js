import { AppNetworkStatusBehavior } from './app-network-status-behavior';
var SPLICES_RX = /\.splices$/;
var LENGTH_RX = /\.length$/;
var NUMBER_RX = /\.?#?([0-9]+)$/;
export class AppStorageBehavior extends AppNetworkStatusBehavior {
    sequentialTransactions = false;
    data = []
    // {
    //     type: Object,
    //     notify: true,
    //     value: function () {
    //         return this.zeroValue;
    //     }
    // }
    log = true;
    observers = ['__dataChanged(data.*)'];

    // created() {
    __initialized = false;
    __syncingToMemory = false;
    __initializingStoredValue = null;
    __transactionQueueAdvances = Promise.resolve();
    // }
    ready() {
        this._initializeStoredValue();
    }

    get isNew() {
        return true;
    }

    get transactionsComplete() {
        return this.__transactionQueueAdvances;
    }

    get zeroValue() {
        return undefined;
    }

    save() {
        return Promise.resolve();
    }

    reset() { }

    destroy() {
        this.data = this.zeroValue;
        return this.save();
    }

    initializeStoredValue() {
        if (this.isNew) {
            return Promise.resolve();
        }
        // If this is not a "new" model, then we should attempt
        // to read an initial value from storage:
        return this._getStoredValue('data').then(function (data) {
            this._log('Got stored value!', data, this.data);
            if (data == null) {
                return this._setStoredValue(
                    'data', this.data || this.zeroValue);
            } else {
                this.syncToMemory(function () {
                    this.set('data', data);
                });
            }
        }.bind(this));
    }

    getStoredValue(storagePath) {
        return Promise.resolve();
    }

    setStoredValue(storagePath, value) {
        return Promise.resolve(value);
    }

    memoryPathToStoragePath(path) {
        return path;
    }

    storagePathToMemoryPath(path) {
        return path;
    }

    syncToMemory(operation) {
        if (this.__syncingToMemory) {
            return;
        }
        this._group('Sync to memory.');
        this.__syncingToMemory = true;
        operation.call(this);
        this.__syncingToMemory = false;
        this._groupEnd('Sync to memory.');
    }

    valueIsEmpty(value) {
        if (Array.isArray(value)) {
            return value.length === 0;
        } else if (Object.prototype.isPrototypeOf(value)) {
            return Object.keys(value).length === 0;
        } else {
            return value == null;
        }
    }

    _getStoredValue(path) {
        return this.getStoredValue(this.memoryPathToStoragePath(path));
    }

    _setStoredValue(path, value) {
        return this.setStoredValue(this.memoryPathToStoragePath(path), value);
    }

    _enqueueTransaction(transaction) {
        if (this.sequentialTransactions) {
            transaction = transaction.bind(this);
        } else {
            var result = transaction.call(this);
            transaction = function () {
                return result;
            };
        }
        return this.__transactionQueueAdvances = this.__transactionQueueAdvances
            .then(transaction)
            .catch(function (error) {
                this._error('Error performing queued transaction.', error);
            }.bind(this));
    }
    _log() {
        if (this.log) {
            console.log.apply(console, arguments);
        }
    }

    _error() {
        if (this.log) {
            console.error.apply(console, arguments);
        }
    }

    _group() {
        if (this.log) {
            console.group.apply(console, arguments);
        }
    }

    _groupEnd() {
        if (this.log) {
            console.groupEnd.apply(console, arguments);
        }
    }
    _initializeStoredValue() {
        if (this.__initializingStoredValue) {
            return;
        }
        this._group('Initializing stored value.');
        var initializingStoredValue =
            this.__initializingStoredValue =
            this.initializeStoredValue().then(function () {
                this.__initialized = true;
                this.__initializingStoredValue = null;
                this._groupEnd('Initializing stored value.');
            }.bind(this));
        return this._enqueueTransaction(function () {
            return initializingStoredValue;
        });
    }

    __dataChanged(change) {
        if (this.isNew ||
            this.__syncingToMemory ||
            !this.__initialized ||
            this.__pathCanBeIgnored(change.path)) {
            return;
        }
        var path = this.__normalizeMemoryPath(change.path);
        var value = change.value;
        var indexSplices = value && value.indexSplices;
        this._enqueueTransaction(function () {
            this._log('Setting', path + ':', indexSplices || value);
            if (indexSplices && this.__pathIsSplices(path)) {
                path = this.__parentPath(path);
                value = this.get(path);
            }
            return this._setStoredValue(path, value);
        });
    }
    __normalizeMemoryPath(path) {
        var parts = path.split('.');
        var parentPath = [];
        var currentPath = [];
        var normalizedPath = [];
        var index;
        for (var i = 0; i < parts.length; ++i) {
            currentPath.push(parts[i]);
            if (/^#/.test(parts[i])) {
                normalizedPath.push(
                    this.get(parentPath).indexOf(this.get(currentPath)));
            } else {
                normalizedPath.push(parts[i]);
            }
            parentPath.push(parts[i]);
        }
        return normalizedPath.join('.');
    }
    __parentPath(path) {
        var parentPath = path.split('.');
        return parentPath.slice(0, parentPath.length - 1).join('.');
    }
    __pathCanBeIgnored(path) {
        return LENGTH_RX.test(path) &&
            Array.isArray(this.get(this.__parentPath(path)));
    }
    __pathIsSplices(path) {
        return SPLICES_RX.test(path) &&
            Array.isArray(this.get(this.__parentPath(path)));
    }
    __pathRefersToArray(path) {
        return (SPLICES_RX.test(path) || LENGTH_RX.test(path))
        Array.isArray(this.get(this.__parentPath(path)));
    }
    __pathTailToIndex(path) {
        var tail = path.split('.').pop();
        return window.parseInt(tail.replace(NUMBER_RX, '$1'), 10);
    }
}