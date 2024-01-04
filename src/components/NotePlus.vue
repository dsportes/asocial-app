<template>
<span>
  <q-btn v-if="bav === 2" dense class="q-mr-xs" no-caps :label="$t('NPLnote', [avSel.nom])" 
    icon="control_point" color="primary" size="md" padding="none"
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

  <q-btn v-if="bav === 1" dense class="q-mr-xs" no-caps :label="$t('NPLnote', [avatar.na.nom])" 
    icon="add" color="primary" @click="okav" padding="none" size="md"/>

  <q-btn v-if="bgr === 1" dense class="q-mr-xs" no-caps :label="$t('NPLnote', [groupe.na.nom])" 
    icon="add" color="orange" @click="okgr" padding="none" size="md"/>

  <note-nouvelle v-if="ui.d.NNnotenouvelle" :estgr="estgr" :groupe="groupe" :avatar="avatar" :notep="notep"/>

</span>
</template>

<script>

import stores from '../stores/stores.mjs'
import { splitPK } from '../app/util.mjs'
import NoteNouvelle from '../panels/NoteNouvelle.vue'

export default {
  name: 'NotePlus',

  components: { NoteNouvelle },

  props: {
  },

  computed: { 
    /* node.type
    1 : racine avatar - bav = 1 // Av fixé, bgr = 0
    2 : racine groupe - bav = 2 // Av par select, bgr = 1 // Gr fixé
    3 : racine groupe zombi
    4 5 : note avatar / groupe 4) bav = 1 // Av fixé, bgr = 0, 5) bav = 2 // Av par select
      bgr = 1 // Gr fixé
    6 7 : note fake avatar / groupe
    */
    notep () { return this.nSt.node.note },
    lna () { return this.aSt.compte.lstAvatarNas },
    bav () { return [0, 1, 2, 0, 1, 2][this.nSt.node.type]},
    bgr () { return [0, 0, 1, 0, 0, 1][this.nSt.node.type]}
  },

  methods: { 
    okav () {
      this.estgr = false
      this.ui.oD('NNnotenouvelle')
    },

    okgr () {
      this.estgr = true
      this.ui.oD('NNnotenouvelle')
    },

    selNa (na) {
      this.avatar = this.aSt.getElt(na.id).avatar
      this.avSel = na
      this.estgr = false
      this.ui.oD('NNnotenouvelle')
    }
  },

  data () {
    return {
      avatar: this.nSt.node.type === 1 || this.nSt.node.type === 4 ? this.aSt.getElt(this.id).avatar : null,
      groupe: this.nSt.node.type === 2 || this.nSt.node.type === 5 ? this.gSt.egr(this.id).groupe : null,
      avSel: this.nSt.node.type === 2 || this.nSt.node.type === 5 ? this.aSt.compte.lstAvatarNas[0] : 0,
      estgr: false
    }
  },

  setup () {
    const ui = stores.ui
    const aSt = stores.avatar
    const nSt = stores.note
    const gSt = stores.groupe
    const { id, ids } = splitPK(nSt.node.key)

    return {
      ui, aSt, gSt, nSt, id
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
