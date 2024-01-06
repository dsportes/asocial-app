<template>
<span>
  <q-btn v-if="s.lna" dense class="q-mr-xs" no-caps :label="$t('NPLnote', [s.avSel.nom])" 
    icon="control_point" color="primary" size="md" padding="none"
    icon-right="expand_more">
    <q-menu anchor="bottom left" self="top left" max-height="10rem" 
      max-width="10rem">
      <q-list class="bg-secondary titre-md text-white q-py-xs">
        <q-item v-for="na in s.lna" :key="na.id" clickable v-close-popup
          @click="selNa(na)">
          {{na.nom}}
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>

  <q-btn v-if="!s.lna" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [s.avSel.nom])" 
    icon="control_point" color="primary" @click="ok(false)" padding="none" size="md"/>

  <q-btn v-if="s.estGr" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [s.groupe.na.nom])" 
    icon="control_point" color="orange" @click="ok(true)" padding="none" size="md"/>

  <note-nouvelle v-if="ui.d.NNnotenouvelle" 
    :estgr="estgr" 
    :groupe="estgr ? s.groupe : null" 
    :avatar="avatarx || (estgr ? null : s.avatar)" 
    :notep="nSt.node.note"/>

</span>
</template>

<script>
import { reactive } from 'vue'
import stores from '../stores/stores.mjs'
import { splitPK } from '../app/util.mjs'
import NoteNouvelle from '../panels/NoteNouvelle.vue'

export default {
  name: 'NotePlus',

  components: { NoteNouvelle },

  props: {
  },

  computed: {
    s () {
      const s = {}
      const n = this.nSt.node
      /* node.type
      1 : racine avatar 
      2 : racine groupe 
      3 : racine groupe zombi
      4 5 : note avatar / groupe 4)
      6 7 : note fake avatar / groupe
      */
      const t = n.type
      s.t = t
      const { id, ids } = splitPK(n.key)
      s.id = id
      if (t === 1 || t === 4 || t === 6) {
        s.estGr = false
        s.avatar = this.aSt.getElt(s.id).avatar
        s.groupe = null
        s.avSel = s.avatar.na
        s.lna = null
      }
      if (t === 2 || t === 5 || t === 7) {
        s.estGr = true
        const lna = this.aSt.compte.lstAvatarNas
        s.avSel = lna[0]
        s.lna = lna.length > 1 ? lna : null
        s.avatar = null
        s.groupe = this.gSt.egr(s.id).groupe
      }
      return s
    }
  },

  methods: { 
    ok (gr) {
      this.estgr = gr
      this.ui.oD('NNnotenouvelle')
    },

    selNa (na) {
      this.avatarx = this.aSt.getElt(na.id).avatar
      this.ok(false)
    }
  },

  data () {
    return {
      estgr: false,
      avatarx: null
    }
  },

  setup () {
    return {
      ui: stores.ui,
      aSt: stores.avatar,
      gSt: stores.groupe, 
      nSt: stores.note
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
