import Promise from 'bluebird';
import Firebase from 'firebase';
import { Container } from 'aurelia-dependency-injection';
import { Configuration } from './configuration';
import { AppIndexedDBMirror } from './app-indeseddb-mirror';
export class ReactiveCollection extends AppIndexedDBMirror {

  _query = null;
  _valueMap = new Map();
  // data = [];

  constructor(path: Array<string>) {
    super()
    if (!Container || !Container.instance) throw Error('Container has not been made global');
    let config = Container.instance.get(Configuration);
    if (!config) throw Error('Configuration has not been set');
    var firebase = Container.instance.get(Firebase);
    // You can use application name instead '[0]' to manage many applications
    this.database = firebase.apps[0].database();
    this._query = this.database.ref(path);
    this._listenToQuery(this._query);
    this._initializeStoredValue();
    this.path = path;
    // debugger
    // this.mirror = new AppIndexedDBMirror();
    // this.key = 'todos';
    // var test = this.mirror.getStoredValue(path);
    // this.mydata = this.mirror.data;
    // this.mydata = this.mirror.persistedData;

  }

  add(item: any): Promise {
    return new Promise((resolve, reject) => {
      let query = this._query.push();
      query.set(item, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(item);
      });
    });
  }

  remove(item: any): Promise {
    if (item === null || item.__firebaseKey__ === null) {
      return Promise.reject({ message: 'Unknown item' });
    }
    return this.removeByKey(item.__firebaseKey__);
  }

  getByKey(key): any {
    return this._valueMap.get(key);
  }

  removeByKey(key) {
    return new Promise((resolve, reject) => {
      this._query.ref().child(key).remove((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key);
      });
    });
  }

  clear() {
    //this._stopListeningToQuery(this._query);
    return new Promise((resolve, reject) => {
      let query = this._query.ref();
      query.remove((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  _listenToQuery(query) {
    let that = this;
    query.on('child_added', (snapshot, previousKey) => {
      that._onItemAdded(snapshot, previousKey);
    });
    query.on('child_removed', (snapshot) => {
      that._onItemRemoved(snapshot);
    });
    query.on('child_changed', (snapshot, previousKey) => {
      that._onItemChanged(snapshot, previousKey);
    });
    query.on('child_moved', (snapshot, previousKey) => {
      that._onItemMoved(snapshot, previousKey);
    });
    query.on("value", function (snapshot) {
      console.log(snapshot.val());
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  }

  _stopListeningToQuery(query) {
    query.off();
  }

  _onItemAdded(snapshot, previousKey) {
    let value = this._valueFromSnapshot(snapshot);
    let index = previousKey !== null ?
      this.data.indexOf(this._valueMap.get(previousKey)) + 1 : 0;
    this._valueMap.set(value.__firebaseKey__, value);
    this.data.splice(index, 0, value);
    // this.setStoredValue(value.__firebaseKey__, value);
    var change = {
      path: value.__firebaseKey__,
      value: value
    };
    this.__dataChanged(change);
  }

  _onItemRemoved(oldSnapshot) {
    let key = oldSnapshot.key;
    let value = this._valueMap.get(key);

    if (!value) {
      return;
    }

    let index = this.data.indexOf(value);
    this._valueMap.delete(key);
    if (index !== -1) {
      this.data.splice(index, 1);
    }
    var change = {
      path: value.__firebaseKey__,
      value: null
    };
    this.__dataChanged(change);
  }

  _onItemChanged(snapshot, previousKey) {
    let value = this._valueFromSnapshot(snapshot);
    let oldValue = this._valueMap.get(value.__firebaseKey__);

    if (!oldValue) {
      return;
    }

    this._valueMap.delete(oldValue.__firebaseKey__);
    this._valueMap.set(value.__firebaseKey__, value);
    this.data.splice(this.data.indexOf(oldValue), 1, value);
    var change = {
      path: value.__firebaseKey__,
      value: value
    };
    this.__dataChanged(change);
  }

  _onItemMoved(snapshot, previousKey) {
    let key = snapshot.key;
    let value = this._valueMap.get(key);

    if (!value) {
      return;
    }

    let previousValue = this._valueMap.get(previousKey);
    let newIndex = previousValue !== null ? this.data.indexOf(previousValue) + 1 : 0;
    this.data.splice(this.data.indexOf(value), 1);
    this.data.splice(newIndex, 0, value);
  }

  _valueFromSnapshot(snapshot) {
    let value = snapshot.val();
    if (!(value instanceof Object)) {
      value = {
        value: value,
        __firebasePrimitive__: true
      };
    }
    value.__firebaseKey__ = snapshot.key;
    return value;
  }
  onlineChanged(online) {
    let query = this._query.ref;
    if (!query) {
      return;
    }
    if (online) {
      this._query.database.goOnline();
    } else {
      this._query.database.goOffline();
    }
  }

  static _getChildLocation(root: string, path: Array<string>) {
    if (!path) {
      return root;
    }
    if (!root.endsWith('/')) {
      root = root + '/';
    }

    return root + (Array.isArray(path) ? path.join('/') : path);
  }
}