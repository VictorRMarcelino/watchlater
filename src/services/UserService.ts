import db, { auth } from "@/database/Database";
import type { UserInterface } from "@/interfaces/UserInterface";
import { useAuthStore } from "@/stores/auth";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

type UserProfilePayload = Omit<UserInterface, 'id' | 'password' | 'admin'>;
type UserProfileUpdate = Partial<Omit<UserInterface, 'id' | 'admin'>>;

const UserService = {

    register: async function(name: string, email: string, password: string) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
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

    createAdmin: async function(name: string, email: string, password: string) {
        const createNewAdmin = httpsCallable<
            { name: string; email: string; password: string },
            { success: boolean; uid: string }
        >(getFunctions(auth.app), "createNewAdmin");

        return createNewAdmin({ name, email, password });
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