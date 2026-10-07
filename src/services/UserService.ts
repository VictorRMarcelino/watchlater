import db, { auth } from "@/database/Database";
import type { UserInterface } from "@/interfaces/UserInterface";
import { useAuthStore } from "@/stores/auth";
import { createUserWithEmailAndPassword, deleteUser, reload, signInWithEmailAndPassword, signOut, updateProfile, verifyBeforeUpdateEmail, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

const INITIAL_ADMIN_EMAIL = import.meta.env.VITE_FIREBASE_INITIAL_ADMIN_EMAIL;
type UserProfilePayload = Omit<UserInterface, 'id' | 'password' | 'email'>;

const UserService = {

    register: async function(name: string, email: string, password: string) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user: UserProfilePayload = {
            uid: credential.user.uid,
            name,
            admin: UserService.isInitialAdmin(credential.user.email ?? email),
        };

        try {
            await setDoc(doc(db, 'users', credential.user.uid), user);
            const token = await credential.user.getIdToken();
            useAuthStore().setAuthentication(credential.user, token, user.admin);
        } catch (error) {
            await deleteUser(credential.user).catch(() => undefined);
            throw error;
        }

        return credential.user;
    },

    isInitialAdmin: function (email: string | null | undefined) {
        return email?.trim().toLowerCase() === INITIAL_ADMIN_EMAIL;
    },

    login: async function(email: string, password: string) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await UserService.getUserProfile(credential.user);
        const token = await credential.user.getIdToken();

        useAuthStore().setAuthentication(credential.user, token, profile.admin);

        return credential.user;
    },

    logout: async function() {
        await signOut(auth);
        useAuthStore().clearAuthentication();
    },

    index: async function() {
        const querySnapshot = await getDocs(collection(db, "users"));

        return querySnapshot.docs.map(userDocument => {
            const data = userDocument.data();
            return {
                id: userDocument.id,
                uid: data.uid,
                name: data.name,
                email: data.email,
                admin: data.admin === true,
            } satisfies UserInterface;
        });
    },

    // update: async function(id: string, task: UserProfilePayload) {
    //     return updateDoc(doc(db, 'users', id), task);
    // },

    setAdmin: async function(uid: string, admin: boolean) {
        await updateDoc(doc(db, 'users', uid), { admin });

        if (auth.currentUser?.uid === uid) {
            useAuthStore().setAdminStatus(admin);
        }
    },

    getUserProfile: async function(user: User) {
        if (!user.email) throw new Error('Authenticated user has no email');

        const userDocument = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userDocument);

        if (snapshot.exists() === false) {
            throw new Error('User profile not found');
        }

        let data = snapshot.data();

        return {
            id: user.uid,
            uid: user.uid,
            name: data.name,
            email: user.email,
            admin: data.admin,
        };
    },

    getCurrentProfile: async function() {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error('No authenticated user');

        await reload(currentUser);
        const profile = await UserService.getUserProfile(currentUser);

        return { id: profile.id, name: profile.name, email: profile.email };
    },

    updateCurrentProfile: async function(name: string, email: string) {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error('No authenticated user');

        const profile = await UserService.getUserProfile(currentUser);
        const currentEmail = currentUser.email;
        const emailVerificationPending = email !== currentEmail;
        if (emailVerificationPending) {
            const profileUrl = new URL(`${import.meta.env.BASE_URL}profile`, globalThis.location?.origin ?? 'http://localhost').toString();
            await verifyBeforeUpdateEmail(currentUser, email, { url: profileUrl });
        }

        await updateProfile(currentUser, { displayName: name });
        await updateDoc(doc(db, 'users', currentUser.uid), {
            name,
            ...(emailVerificationPending ? { pendingEmail: email } : { email, pendingEmail: null }),
        });

        return { id: profile.id, name, email: currentEmail, emailVerificationPending };
    },


    destroy: async function(id: string) {
        const userDocument = await getDoc(doc(db, 'users', id));
        const currentUser = auth.currentUser;
        const userData = userDocument.data();
        const deletesCurrentUser = Boolean(currentUser && (
            userData?.uid === currentUser.uid || userData?.email === currentUser.email
        ));

        if (deletesCurrentUser && currentUser) {
            await deleteUser(currentUser);
        }

        await deleteDoc(doc(db, 'users', id));

        if (deletesCurrentUser) {
            await signOut(auth);
            useAuthStore().clearAuthentication();
        }

        return deletesCurrentUser;
    }
}

export default UserService;
