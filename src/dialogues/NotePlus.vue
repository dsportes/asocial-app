<template>
<span>
  <q-btn v-if="bav === 2" dense class="q-mr-xs btn" no-caps :label="$t('NPLnote', [avSel.nom])" 
    icon="control_point" color="primary"
    icon-right="expand_more">
    <q-menu anchor="bottom left" self="top left" max-height="10rem" 
      max-width="10rem">
      <q-list class="bg-secondary titre-md text-white q-py-xs">
        <q-item v-for="na in lna" :key="na.id" clickable v-close-popup
          @click="selNa(na)">
          {{na.nom}}
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>

  <q-btn v-if="bav === 1" dense class="q-mr-xs btn" no-caps :label="$t('NPLnote', [avatar.na.nom])" 
    icon="control_point" color="primary" @click="okav"/>

  <q-btn v-if="bgr === 1" dense class="q-mr-xs btn" no-caps :label="$t('NPLnote', [groupe.na.nom])" 
    icon="control_point" color="orange" @click="okgr"/>

  <q-dialog v-model="notenouvelle" persistent full-height>
    <note-nouvelle :estgr="estgr" :groupe="groupe" :avatar="avatar" :notep="notep"/>
  </q-dialog>
</span>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { $t, splitPK } from '../app/util.mjs'
import NoteNouvelle from '../dialogues/NoteNouvelle.vue'
import { MD } from '../app/modele.mjs'

// const colors = ['','primary','orange','negative','primary','orange','primary','orange']

export default {
  name: 'NotePlus',

  components: { NoteNouvelle },

  props: {
  },

  computed: { },

  methods: { 
  },

  data () {
    return {
    }
  },

  setup () {
    const aSt = stores.avatar
    const nSt = stores.note
    const gSt = stores.groupe
    const bav = ref(0)
    const bgr = ref(0)
    const avatar = ref()
    const groupe = ref()
    const notep = ref()
    const estgr = ref(false)

    const avSel = ref()
    const lna = ref()

    function init() {
      const node = nSt.node
      const { id, ids } = splitPK(nSt.node.key)
      notep.value = nSt.node.note
      lna.value = aSt.compte.lstAvatarNas

      switch (node.type) {
      /*      
      1 : racine avatar
      2 : racine groupe
      3 : racine groupe zombi
      4 5 : note avatar / groupe
      6 7 : note fake avatar / groupe
      */
      case 1: {
        bav.value = 1 // Av fixé
        bgr.value = 0
        avatar.value = aSt.getElt(id).avatar
        groupe.value = null
        break
      }
      case 2: {
        bav.value = 2 // Av par select
        bgr.value = 1 // Gr fixé
        avSel.value = lna.value[0]
        groupe.value = gSt.egr(id).groupe
        break
      }
      case 4: {
        bav.value = 1 // Av fixé
        bgr.value = 0
        avatar.value = aSt.getElt(id).avatar
        groupe.value = null
        break
      }
      case 5: {
        bav.value = 2 // Av par select
        bgr.value = 1 // Gr fixé
        avSel.value = lna.value[0]
        groupe.value = gSt.egr(id).groupe
        break
      }
      }
    }

    nSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setCourant') {
          init()
        }
      })
    })

    function okav () {
      estgr.value = false
      ovnotenouvelle()
    }

    function okgr () {
      estgr.value = true
      ovnotenouvelle()
    }

    function selNa (na) {
      avatar.value = aSt.getElt(na.id).avatar
      avSel.value = na
      estgr.value = false
      ovnotenouvelle()
    }

    init()

    const notenouvelle = ref(false)
    function ovnotenouvelle () { MD.oD(notenouvelle) }

    return {
      notenouvelle, selNa, okav, okgr, 
      bav, bgr, avSel, lna, avatar, groupe, notep, estgr
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  min-height: 1.6rem !important
  max-height: 1.6rem !important
</style>
