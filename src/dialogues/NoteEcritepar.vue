<template>
  <div class="titre-md">
    <q-btn-dropdown no-caps dense :color="naAut ? 'primary' : 'warning'"
      :label="naAut ? $t('PNOaut1' + (fic || ''), [naAut.nom]) : $t('PNOaut2')" 
      content-style="width:25rem!important">
      <q-list class="bg-secondary text-white q-py-xs">
        <q-item v-for="e in la" :key="e.na.id" 
          :clickable="!e.ko"
          v-close-popup @click="selNa(e.na)"
          class="row items-start full-width">
            <div class="fs-md col-4">{{e.na.nom}}</div>
            <div class="col-8 titre-md" 
              :class="e.ko ? 'text-warning bg-yellow-5 fs-sm text-bold' : ''">
              {{!e.ko ? $t('ok') : $t('PNOecrko' + e.ko)}}
            </div>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'NoteEcritepar',

  components: { },

  props: { 
    groupe: Object, // groupe de la note (édition ET nouvelle)
    note: Object, // Pour édition d'une note existante seulement
    fic: String // a/m Modif de label pour "ajout" / "modif" de fichier
  },

  computed: { },

  methods: { },

  data () {
    return {
    }
  },

  setup (props, context) {
    const aSt = stores.avatar
    const nSt = stores.note
    /* {na, ko} ko: 1 pas auteur, 2: n'a pas exclusiité (edition seulement) */
    const la = ref([])
    const g = toRef(props, 'groupe')
    const n = toRef(props, 'note')
    const xav = ref()
    const naAut = ref()

    function init () {
      const auts = nSt.note ? nSt.note.auts || [] : []
      const l = []
      let ok = false
      // Map (cle:im val:na) des avc participants au groupe idg
      for (const [im, na] of aSt.compte.imNaGroupe(g.value.id)) { 
        let i = auts.indexOf(im)
        i = i === -1 ? 99999 : i
        const x = { na, i, ko: 0 }
        const a = g.value.estAuteur(im)
        if (!a) {
          x.ko = 1
        } else {
          if ((n.value && n.value.im) && (n.value.im !== im)) x.ko = 2
          else ok = true
        }
        l.push(x)
      }
      l.sort((a,b) => { return a.ko ? (b.ko ? 0 : 1) : (!b.ko ? (a.i < b.i ? -1 : 1) : 1)})
      la.value = l
      selNa(ok ? l[0].na : null)
    }

    function selNa(na) {
      naAut.value = na
      context.emit('ok', na)
    }

    init ()

    return {
      aSt, selNa, la, xav, naAut
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w25
  min-width: 25rem !important
</style>
