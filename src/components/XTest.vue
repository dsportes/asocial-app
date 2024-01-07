<template>
<div>
  <q-btn v-if="!estAv && lna" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [lna[0].nom])" 
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

  <q-btn v-if="estAv" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [avatar.na.nom])" 
    icon="control_point" color="primary" @click="ok(false)" padding="none" size="md"/>

  <q-btn v-if="!estAv" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [groupe.na.nom])" 
    icon="control_point" color="orange" @click="ok(true)" padding="none" size="md"/>

  <note-nouvelle v-if="ui.d.NNnotenouvelle" 
    :estgr="estgr" 
    :groupe="estgr ? groupe : null" 
    :avatar="avatarx || (estgr ? null : aSt.getElt(id).avatar)" 
    :notep="nSt.node.note"/>
</div>
</template>

<script>
//import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { splitPK } from '../app/util.mjs'
import NoteNouvelle from '../panels/NoteNouvelle.vue'

export default ({
  name: 'XTest',

  props: { k1: String },

  components: { NoteNouvelle },

  computed: {
    n () { return this.nSt.node }, // OK: est réévalué quand nSt.node change
    t () { return this.n.type },
    estAv () { return this.t === 1 || this.t === 4 || this.t === 6},
    id () { return splitPK(this.n.key).id },
    groupe () { return this.estAv ? null : this.gSt.egr(this.id).groupe },
    avatar () { return this.estAv ? this.aSt.getElt(this.id).avatar : null },
    lna () { const l = this.aSt.compte.lstAvatarNas; return l.length > 1 ? l : null }
  },

  data () { return {
    avatarx: null,
    estgr: false
  }},

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
  
  setup () {
    const nSt = stores.note
    // const k2 = ref(nSt.node.key) // KO: n'est pas réévalué quand nSt.node change
    return {
      aSt: stores.avatar,
      gSt: stores.groupe,
      nSt: stores.note,
      ui: stores.ui
      // idc: stores.ui.getIdc(),
      // k2
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
