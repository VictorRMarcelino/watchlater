import db from '@/database/Database'
import type { ShowInterface } from '@/interfaces/ShowInterface'
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'

type ShowPayload = Omit<ShowInterface, 'id'>

const ShowService = {
  index: async function () {
    const querySnapshot = await getDocs(collection(db, 'shows'))

    return querySnapshot.docs.map((showDoc) => {
      const data = showDoc.data()

      return {
        id: showDoc.id,
        title: data.title,
        notes: data.notes,
        whereToWatch: data.whereToWatch,
      } satisfies ShowInterface
    })
  },

  store: function (show: ShowPayload) {
    return addDoc(collection(db, 'shows'), show)
  },

  update: function (id: string, show: Partial<ShowInterface>) {
    return updateDoc(doc(db, 'shows', id), show)
  },

  destroy: function (id: string) {
    return deleteDoc(doc(db, 'shows', id))
  },
}

export default ShowService