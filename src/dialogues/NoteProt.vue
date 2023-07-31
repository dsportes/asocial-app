<template>
<div :class="dkli(0) + ' bs dp30'" style="height:10rem">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOpetit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOpetit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-py-md column justify-center items-center">
      <div class="row">
        <bouton-undo :cond="(this.prot ? 1 : 0)!==nSt.node.note.p" 
          @click="prot=nSt.node.note.p ? true : false"/>
        <q-toggle class="col-auto titre-md" v-model="prot" :label="$t('PNOpr')"/>
      </div>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import { ProtNote } from '../app/operations.mjs'
import { dkli } from '../app/util.mjs'

export default {
  name: 'NoteProt',

  components: { BoutonHelp, BoutonUndo },

  computed: {
    modifie () { return (this.prot ? 1 : 0) !== this.nSt.note.p }
  },

  methods: {
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    async valider () {
      const n = this.nSt.note
      await new ProtNote().run(n.id, n.ids, this.prot ? 1 : 0)
      MD.fD()
    }
  },

  data () {
    return {
    }
  },

  setup () {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe

    const avatar = ref(null)
    const groupe = ref(null)

    const prot = ref(nSt.node.note.p ? true : false)
    switch (nSt.node.type) {
      case 4: {
        avatar.value = aSt.getElt(nSt.note.id).avatar
        break
      }
      case 5: {
        groupe.value = gSt.egr(nSt.note.id).groupe
        break
      }
    }
    return {
      ui, session, nSt, aSt, gSt,
      avatar, groupe, prot,
      MD, dkli
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
