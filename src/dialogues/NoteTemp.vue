<template>
<div :class="dkli + ' bs dp30'" style="height:10rem">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOtptit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOtptit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="column justify-center">
      <div class="q-pa-xs row">
        <div class="col-6 titre-md">
          <bouton-undo :cond="temp.value!==nbj" @click="temp=options[0]"/>
          <span>{{temp.value === 99999999 ? $t('PNOperm') : $t('PNOtemp', temp.value, { count: temp.value })}}</span>
        </div>
        <q-select class="col-6 mh titre-md" :label="$t('PNOtp')" v-model="temp" :options="options"
          transition-show="scale" transition-hide="scale" filled
          bg-color="secondary" color="white" />
      </div>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref } from 'vue'
import { AMJ } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import { $t } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import { TempNote } from '../app/operations.mjs'

export default {
  name: 'NoteTemp',

  components: { BoutonHelp, BoutonUndo },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return this.temp.value !== nbj }
  },

  methods: {
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    async valider () {
      const n = this.nSt.note
      await new TempNote().run(n.id, n.ids, this.temp.value)
      MD.fD()
    }
  },

  data () {
    return {
      temp: this.options[0], //permanent ou temporaire- nbj temp
    }
  },

  setup () {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const st = nSt.node.note.st
    const nbj = AMJ.diff(st, session.dateJourConnx)

    const options = [
      { label: $t('tempx', [nbj]), value: nbj},
      { label: $t('permanent'), value: 99999999 },
      { label: $t('temp1'), value: 1 },
      { label: $t('temp7'), value: 7 },
      { label: $t('temp14'), value: 14 },
      { label: $t('temp30'), value: 30 },
      { label: $t('temp60'), value: 60 },
      { label: $t('temp90'), value: 90 }
    ]

    const avatar = ref(null)
    const groupe = ref(null)

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
      options, nbj, avatar, groupe,
      MD
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
