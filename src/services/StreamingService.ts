import db from '@/database/Database'
import type { StreamingInterface } from '@/interfaces/StreamingInterface'
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'

type StreamingPayload = Omit<StreamingInterface, 'id'>

const StreamingService = {
  index: async function () {
    const querySnapshot = await getDocs(collection(db, 'streamings'))

    return querySnapshot.docs.map((streamingDoc) => {
      const data = streamingDoc.data()
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt

      return {
        id: streamingDoc.id,
        title: data.title,
        createdAt,
      } satisfies StreamingInterface
    })
  },

  store: function (streaming: StreamingPayload) {
    return addDoc(collection(db, 'streamings'), streaming)
  },

  update: function (id: string, streaming: Partial<StreamingInterface>) {
    return updateDoc(doc(db, 'streamings', id), streaming)
  },

  destroy: function (id: string) {
    return deleteDoc(doc(db, 'streamings', id))
  },
}

export default StreamingService