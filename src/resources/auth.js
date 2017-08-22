import { inject } from 'aurelia-framework';
import Promise from 'bluebird';
import Firebase from 'firebase';
import { Configuration } from './configuration';
import { User } from './user';

@inject(Configuration, Firebase)
export class Auth {
    constructor(configuration, firebase) {
        var app = firebase.initializeApp(configuration.getValue('config'), configuration.getValue('name'));
        this.firebase = app.auth();
        this.currentUser = new User();

        this.firebase.onAuthStateChanged((result) => {
            this.currentUser.update(result);
        });
    }

    createUser(email, password) {
        return new Promise((resolve, reject) => {
            this.firebase.createUserWithEmailAndPassword(email, password).then((result) => {
                let user = new User(result);
                user.email = user.email || email; // Because firebase result doesn't provide the email
                resolve(user);
            });
        });
    }

    createUserAndSignIn(email, password) {
        return this.createUser(email, password).then(() => {
            return this.signIn(email, password);
        });
    }

    signIn(email, password) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.firebase.signInWithEmailAndPassword(email, password).then(result => {
                let user = new User(result);
                that.currentUser = user;
                resolve(user);
            });
        });
    }

    getCurrentUser() {
        return this.firebase.currentUser;
    }

    changeEmail(oldEmail, newEmail) {
        return new Promise((resolve, reject) => {
            var user = this.getCurrentUser();
            user.updateEmail(newEmail).then(() => {
                this.currentUser.email = newEmail;
                let result = { oldEmail, newEmail };
                resolve(result);
            });
        });
    }

    changePassword(oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            var user = this.getCurrentUser();
            user.updatePassword(newPassword).then(() => {
                let result = { email: email };
                resolve(result);
            });
        });
    }

    deleteUser(email: string, password: string): Promise {
        return new Promise((resolve, reject) => {
            var user = this.getCurrentUser();
            user.delete().then(() => {
                resolve();
            });
        });
    }

}