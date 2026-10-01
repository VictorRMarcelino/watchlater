import db, { auth } from "@/database/Database";
import type { UserInterface } from "@/interfaces/UserInterface";
import { useAuthStore } from "@/stores/auth";
import { createUserWithEmailAndPassword, deleteUser, reload, signInWithEmailAndPassword, signOut, updateProfile, verifyBeforeUpdateEmail, type User } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

type UserProfilePayload = Omit<UserInterface, 'id' | 'password' | 'admin'>;
type UserProfileUpdate = Partial<Omit<UserInterface, 'id' | 'admin'>>;

const UserService = {

    register: async function(name: string, email: string, password: string) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        try {
            await UserService.defineUserAdmin(credential.user.uid);
        } catch (error) {}

        const user: UserProfilePayload = {
            name,
            email: credential.user.email ?? email
        };

        try {
            const tokenResult = await credential.user.getIdTokenResult(true);
            await addDoc(collection(db, 'users'), user);
            useAuthStore().setAuthentication(credential.user, tokenResult.token, tokenResult.claims.admin === true);
        } catch (error) {
            await deleteUser(credential.user).catch(() => undefined);
            throw error;
        }

        return credential.user;
    },

    defineNewUserAdmin: async function(name: string, email: string, password: string) {
        const defineNewUserAdmin = httpsCallable<
            { name: string; email: string; password: string },
            { success: boolean; uid: string }
        >(getFunctions(auth.app), "defineNewUserAdmin");

        return defineNewUserAdmin({ name, email, password });
    },

    defineUserAdmin: async function(uid: string) {
        const defineUserAdmin = httpsCallable<
            { uid: string },
            { success: boolean; uid: string }
        >(getFunctions(auth.app), "defineUserAdmin");

        return defineUserAdmin({ uid });
    },

    login: async function(email: string, password: string) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const tokenResult = await credential.user.getIdTokenResult(true);
        const authStore = useAuthStore();

        authStore.setAuthentication(credential.user, tokenResult.token, tokenResult.claims.admin === true);

        return credential.user;
    },

    logout: async function() {
        await signOut(auth);
        useAuthStore().clearAuthentication();
    },

    index: async function() {
        const querySnapshot = await getDocs(collection(db, "users"));

        const users = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                password: data.password
            } satisfies UserInterface;
        }) as UserInterface[];
        return users;
    },

    update: function(id: string, task: UserProfileUpdate) {
        return updateDoc(doc(db, 'users', id), task);
    },

    getCurrentProfile: async function() {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error('No authenticated user');

        await reload(currentUser);
        const profile = await UserService.findCurrentUserDocument(currentUser);
        if (!profile) throw new Error('User profile not found');

        const data = profile.data();
        const email = currentUser.email ?? data.email as string;
        if (data.email !== email || data.uid !== currentUser.uid) {
            await updateDoc(doc(db, 'users', profile.id), { email, uid: currentUser.uid, pendingEmail: null });
        }

        return { id: profile.id, name: data.name as string, email };
    },

    updateCurrentProfile: async function(name: string, email: string) {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error('No authenticated user');

        const currentEmail = currentUser.email;
        const profile = await UserService.findCurrentUserDocument(currentUser);
        if (!profile) throw new Error('User profile not found');

        const emailVerificationPending = email !== currentEmail;
        if (emailVerificationPending) {
            const profileUrl = new URL(`${import.meta.env.BASE_URL}profile`, globalThis.location?.origin ?? 'http://localhost').toString();
            await verifyBeforeUpdateEmail(currentUser, email, { url: profileUrl });
        }
        await updateProfile(currentUser, { displayName: name });
        await updateDoc(doc(db, 'users', profile.id), {
            name,
            uid: currentUser.uid,
            ...(emailVerificationPending ? { pendingEmail: email } : { email, pendingEmail: null }),
        });

        return { id: profile.id, name, email: currentEmail, emailVerificationPending };
    },

    findCurrentUserDocument: async (user: User) => {
        const usersCollection = collection(db, 'users');
        const uidMatches = await getDocs(query(usersCollection, where('uid', '==', user.uid)));
        if (uidMatches.docs[0]) return uidMatches.docs[0];
        if (!user.email) return undefined;

        const emailMatches = await getDocs(query(usersCollection, where('email', '==', user.email)));
        return emailMatches.docs[0];
    },

    destroy: async function(id: string) {
        const userDocument = await getDoc(doc(db, 'users', id));
        const currentUser = auth.currentUser;
        const userEmail = userDocument.data()?.email;
        const deletesCurrentUser = Boolean(currentUser && userEmail === currentUser.email);

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