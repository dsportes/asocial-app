<template>
  <div :class="'col items-start ' + dkli(idx)">
    <div>
      <span class="text-bold fs-md q-mr-sm">{{t.na.nom}}</span> 
      <span class="text-bold fs-sm font-mono q-mr-sm">#{{id}}</span> 
    </div>
    <div v-if="t.info" class="q-ml-md q-my-xs bord row">
      <show-html class="col" :idx="idx" zoom maxh="3rem" :texte="t.info"/>
      <q-btn v-if="edit && session.estComptable" color="primary" 
        class="col-auto q-ml-sm btn2" size="sm" dense icon="edit" @click="editer"/>
    </div>
    <div v-else class="q-ml-md q-my-xs">
      <span class="text-italic">{{$t('PTnoinfo')}}</span>
      <q-btn v-if="edit && session.estComptable" class="q-ml-sm" size="sm" dense
        :label="$t('PTecr')" color="primary" icon="edit" @click="editer"/>
    </div>
    <apercu-notif class="q-ml-md q-my-xs" :src="t" :edit="edit && session.estComptable" :idx="idx"/>
    <apercu-notif class="q-ml-md q-my-xs" :src="t" sponsor :edit="edit && !session.estComptable" :idx="idx"/>
    <div class="q-ml-md q-mt-xs row peitelargeur">
      <div class="col-6 text-right">{{$t('NTv1')}}</div>
      <div class="col-3 text-center font-mono">{{t.a1}} - {{ed1(t.a1)}}</div>
      <div class="col-3 text-center font-mono">{{t.r1}} - {{ed1(t.r1)}}</div>
    </div>
    <div class="q-ml-md q-mb-xs row peitelargeur">
      <div class="col-6 text-right">{{$t('NTv2')}}</div>
      <div class="col-3 text-center font-mono">{{t.a2}} - {{ed2(t.a2)}}</div>
      <div class="col-3 text-center font-mono">{{t.r2}} - {{ed2(t.r2)}}</div>
    </div>
    <div v-if="t.blocage">
      <span class="titre-md q-my-xs">{{$t('SBn' + t.blocage.niv) + $t('SBdisp2', [t.blocage.njrb])}}</span>
      <q-btn v-if="edit && session.estComptable" color="primary" 
        class="q-ml-sm btn2" size="sm" dense icon="edit" @click="editerbl"/>
      <q-btn v-else color="primary" 
        class="q-ml-sm btn2" size="sm" dense icon="open_in_new" :label="$t('detail')" @click="affichbl"/>
    </div>
    <div v-else>
      <div v-if="edit && session.estComptable">
        <span class="titre-md q-my-xs text-italic">{{$t('SNnon')}}</span>
        <q-btn color="primary" class="q-ml-sm btn2" size="sm" dense icon="edit" @click="editerbl"/>
      </div>
    </div>
    
    <q-dialog v-model="edbl" persistent>
      <q-card class="petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="closebl"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t(bloc.dh ? 'SBdet' : 'SBnv', [t.na.nom])}}
          </q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <synthese-blocage :bl-tr="bloc"/>
      </q-card>
    </q-dialog>

    <q-dialog v-model="edcom" persistent>
      <q-card class="petitelargeur">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="close"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NTcom', [t.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md style="height:50vh" :lgmax="1000" editable :texte="t.info"
          :label-ok="$t('valider')" modetxt @ok="valider"/>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>

import { toRef, ref } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import ApercuNotif from './ApercuNotif.vue'
import { edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { SetAttribut } from '../app/operations.mjs'
import { crypter } from '../app/webcrypto.mjs'
import BoutonHelp from './BoutonHelp.vue'
import EditeurMd from './EditeurMd.vue'
import SyntheseBlocage from './SyntheseBlocage.vue'
import { Blocage } from '../app/modele.mjs'

export default {
  name: 'ApercuTribu',

  props: { id: Number, idx: Number, edit: Boolean },

  components: { ShowHtml, ApercuNotif, EditeurMd, BoutonHelp, SyntheseBlocage },

  computed: { },

  data () { return {
    edcom: false,
    edbl: false,
    info: '',
    bloc: null
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },
    editer () {
      this.info = this.t.info || ''
      this.edcom = true
    },
    async valider (txt) {
      const buf = txt ? await crypter(this.session.clek, txt) : null
      await new SetAttribut().run(this.id, 'infok', buf)
      this.close()
    },
    close () { this.edcom = false},
    editerbl () {
      this.bloc = this.t.blocage ? this.t.blocage.clone() : new Blocage(null, 0)
      this.edbl = true
    },
    afficherbl () {
      this.bloc = this.t.blocage ? this.t.blocage.clone() : new Blocage(null, 0)
      this.edbl = true
    },
    closebl () { this.edbl = false }
  },

  setup (props) {
    const avStore = stores.avatar
    const session = stores.session
    const id = toRef(props, 'id')

    function getT () {
      const t = avStore.getTribu(id.value)
      return t
    }

    const t = ref(getT())
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setTribuC' || name === 'setTribu') && args[0].id === id.value) {
          t.value = getT()
        }
      })
    })

    return {
      session,
      t
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn2
  max-height: 1.3rem
</style>
