<template>
<div :class="dkli + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOfictit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOfictit2', [groupe.na.nomc])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ro!==0 || exv!==0" inset
      class="full-width bg-yellow-5 text-black titre-md text-bold">
      <div class="row justify-center">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span>{{$t('PNOro' + ro)}}</span>
        <span>{{$t('PNOexv2' + exv)}}</span>
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">

    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
// import BoutonUndo from '../components/BoutonUndo.vue'
import { MajNote } from '../app/operations.mjs'
import { UNITEV2 } from '../app/api.mjs'

export default {
  name: 'NoteFichier',

  components: { 
    BoutonHelp, 
    // BoutonUndo
  },

  props: { ro: Number },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return false }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    async valider () {
      /*
      const dv = this.texte.length - this.nSt.note.txt.length
      if (this.er && dv > 0) {
        await afficherDiag($t('PNOw' + this.er))
        return
      }
      if (this.type === 5) {
        const n = this.erGr(dv)
        if (n === 6) {
          await afficherDiag($t('PNOer11'))
          return
        }
      }
      if (this.type === 4) {
        const c = this.aSt.compta.compteurs
        if (c.v1 + dv > c.q1 * UNITEV1) {
          await afficherDiag($t('PNOer10'))
          return
        }
      }
      const idc = this.avatar ? this.session.compteId : this.groupe.idh
      const n = this.nSt.note
      await new MajNote()
        .run(n.id, n.ids, this.im, n.auts, this.texte, this.prot, idc)
      */
      MD.fD()
    }
  },

  data () {
    return {
      texte: '',
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const cfg = stores.config

    const ro = toRef(props, 'ro')

    const avatar = ref(null)
    const groupe = ref(null)
    const exv = ref(0)

    if (nSt.node.type === 4) {
      if (ro.value === 0 && aSt.exV2) exv.value = 1
      avatar.value = aSt.getElt(nSt.note.id).avatar
    } else if (nSt.node.type === 5) {
      groupe.value = gSt.egr(nSt.note.id).groupe
      if (ro.value === 0 && ergrV2()) exv.value = 2
    }

    function ergrV2 (dv) {
      const g = groupe.value
      const eg = gSt.egr(g.id)
      if (eg.objv.vols.v2 + dv >= eg.objv.vols.q2 * UNITEV2) return true
      return false
    }

    return {
      ui, session, nSt, aSt, gSt, cfg,
      exv, avatar, groupe,
      MD, ergrV2
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh
  max-height: 3.2rem
  width: 15rem
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 3px solid $warning
  border-radius: 5px
.dec
  position: relative
  left: -7px
</style>
