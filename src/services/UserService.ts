import db, { auth } from "@/database/Database";
import type { UserInterface } from "@/interfaces/UserInterface";
import { useAuthStore } from "@/stores/auth";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

type UserPayload = Omit<UserInterface, 'id' | 'password'>;

const UserService = {

    register: async function(name: string, email: string, password: string) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = {
            name,
            email: credential.user.email ?? email,
            admin: false
        } satisfies UserPayload;

        await addDoc(collection(db, 'users'), user);

        const token = await credential.user.getIdToken();
        useAuthStore().setAuthentication(credential.user, token, false);

        return credential.user;
    },

    login: async function(email: string, password: string) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const token = await credential.user.getIdToken();
        const authStore = useAuthStore();
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userProfile = usersSnapshot.docs.find((userDocument) => userDocument.data().email === email);

        authStore.setAuthentication(credential.user, token, userProfile?.data().admin === true);

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
                password: data.password,
                admin: data.admin === true
            } satisfies UserInterface;
        }) as UserInterface[];
        return users;
    },

    update: function(id: string, task: Partial<UserInterface>) {
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