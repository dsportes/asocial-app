import { defineStore } from 'pinia'
import { useNoteStore } from './note-store.js'

export const useFiltreStore = defineStore('filtre', {
  state: () => ({
    filtre: { 
      chats: { tous: true, rac: 0 },
      partition: {},
      people: {},
      groupes: { tous: true },
      groupe: {},
      notes: {}
    },
    mcgroupe: false,
    tri: {
      espace: 0,
      partition: 0,
      groupe: 0,
    },
    stats: {
      groupes: {},
      groupe: {}
    }
  }),

  getters: {
  },

  actions: {
    setFiltre (nom, champ, val) {
      let f = this.filtre[nom]; if (!f) { f = {}; this.filtre[nom] = f}
      f[champ] = val
      if (nom === 'notes') {
        const fx = this.filtre.notes
        const dh = Date.now()
        let f
        if (fx.vf || fx.note || fx.nbj || fx.mcp || fx.mcn || fx.avgr) {
          f = {
            v: '' + dh,
            vf: fx.vf || 0,
            note: fx.note || null,
            lim: fx.nbj ? dh - (86400000 * fx.nbj) : 0,
            mcp: fx.mcp ? new Set(fx.mcp) : null,
            mcn: fx.mcn ? new Set(fx.mcn) : null,
            avgr: fx.avgr || 0
          }
        } else f = { v: '0' }
        const nSt = useNoteStore()
        nSt.setFiltre(f)
      }
      this.filtre[nom] = { ...f }
    },
    setTri (nom, val) {
      this.tri[nom] = val
    },
    setMcgroupe (val) {
      this.mcgroupe = val
    }
  }
})
