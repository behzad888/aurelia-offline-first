import { computedFrom } from 'aurelia-framework';
import { TodoCollection } from './todoCollection';
import { inject } from 'aurelia-dependency-injection';
import { Auth } from 'resources/index';

@inject(Auth, TodoCollection)
export class Welcome {
  heading = 'Welcome to the Aurelia Navigation App!';
  firstName = 'John';
  lastName = 'Doe';
  previousValue = this.fullName;
  todoText = null;
  message = null;
  constructor(authManager, collection: TodoCollection) {
    this.user = authManager.currentUser;
    this.authManager = authManager;
    this.collection = collection;
    this.collection.onlineChaned(true);
  }
  //Getters can't be directly observed, so they must be dirty checked.
  //However, if you tell Aurelia the dependencies, it no longer needs to dirty check the property.
  //To optimize by declaring the properties that this getter is computed from, uncomment the line below
  //as well as the corresponding import above.
  @computedFrom('firstName', 'lastName')
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  submit() {
    this.authManager.signIn(this.email, this.password)
      .then(() => {
        this.router.navigateToRoute('accountIndex');
      })
      .catch((e) => {
        this.message = e.message;
      });
  }

  canDeactivate() {
    if (this.fullName !== this.previousValue) {
      return confirm('Are you sure you want to leave?');
    }
  }
  add() {
    this.collection.add(this.todoText).then(() => {
      this.message = null;
      this.todoText = null;
    })
      .catch((e) => {
        this.message = e.message;
      });
  }
  @computedFrom('collection.data', 'selectedStateFilter', 'selectedOwnerFilter')
  get filteredItems() {
    let data = this.collection.data;
    if (!this.selectedStateFilter && !this.selectedOwnerFilter) {
      return data;
    }

    // Filter by owner
    if (this.selectedOwnerFilter) {
      data = data.filter((item) => {
        return item.ownerId === this.user.uid;
      }, this);
    }

    // Filter by status
    if (this.selectedStateFilter) {
      data = data.filter((item) => {
        return item.isCompleted === (this.selectedStateFilter === 'completed');
      }, this);
    }
    return data;
  }
}

export class UpperValueConverter {
  toView(value) {
    return value && value.toUpperCase();
  }
}
