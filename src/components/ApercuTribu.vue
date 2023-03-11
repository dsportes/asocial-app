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
      <span class="titre-sm">{{$t('PTnoinfo')}}</span>
      <q-btn v-if="edit && session.estComptable" class="q-ml-sm" size="sm" dense
        :label="$t('PTecr')" color="primary" icon="edit" @click="editer"/>
    </div>

    <apercu-notif class="q-ml-md q-my-xs" :src="t" :edit="edit && session.estComptable" :idx="idx"/>
    <apercu-notif class="q-ml-md q-my-xs" :src="t" sponsor :edit="edit && !session.estComptable" :idx="idx"/>

    <div class="q-ml-md q-mt-xs row peitelargeur">
      <div class="col-6 titre-sm">{{$t('NTv1')}}</div>
      <div class="col-3 text-center font-mono">{{t.cpt.a1 || 0}} - {{ed1(t.cpt.a1 || 0)}}</div>
      <div class="col-3 text-center font-mono">{{t.cpt.q1 || 0}} - {{ed1(t.cpt.q1 || 0)}}</div>
    </div>
    <div class="q-ml-md q-mb-xs row peitelargeur">
      <div class="col-6 titre-sm">{{$t('NTv2')}}</div>
      <div class="col-3 text-center font-mono">{{t.cpt.a2 || 0}} - {{ed2(t.cpt.a2 || 0)}}</div>
      <div class="col-3 text-center font-mono">{{t.cpt.q2 || 0}} - {{ed2(t.cpt.q2 || 0)}}</div>
    </div>

    <div class="q-ml-md q-mt-sm row justify-start">
      <div class="col-6 titre-sm">{{$t('PTntfc')}}</div>
      <div class="col-6">
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nco[0]}}</span>
        <notif-ico :gravite="1"/>
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nco[1]}}</span>
        <notif-ico :gravite="2"/>
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nco[2]}}</span>
        <notif-ico :gravite="3"/>
      </div>
    </div>
    <div class="q-ml-md q-mt-xs row justify-start">
      <div class="col-6 titre-sm">{{$t('PTntfs')}}</div>
      <div class="col-6">
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nsp[0]}}</span>
        <notif-ico :gravite="1"/>
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nsp[1]}}</span>
        <notif-ico :gravite="2"/>
        <span class="q-ml-md font-mono q-mr-xs">{{t.cpt.nsp[2]}}</span>
        <notif-ico :gravite="3"/>
      </div>
    </div>

    <div v-if="t.blocage">
      <blocage-ico :niveau="t.blocage.niv" class="q-mr-xs"/>
      <span class="titre-sm q-my-sm text-warning">{{$t('SBn' + t.blocage.niv) + $t('SBdisp2', [t.blocage.njrb])}}</span>
      <q-btn v-if="edit && session.estComptable" color="primary" 
        class="q-ml-sm btn2" size="sm" dense icon="edit" @click="editerbl(true)"/>
      <q-btn v-else color="primary" 
        class="q-ml-sm btn2" size="sm" dense icon="open_in_new" :label="$t('detail')" @click="(editerbl(false))"/>
    </div>
    <div v-else>
      <div v-if="edit && session.estComptable">
        <span class="titre-sm q-my-sm text-italic">{{$t('SNnon')}}</span>
        <q-btn color="primary" class="q-ml-sm btn2" size="sm" dense icon="edit" @click="editerbl(true)"/>
      </div>
    </div>
    
    <q-dialog v-model="edbl" persistent>
      <ed-blocage :bl-tr="bloc" :na-tr="t.na" :edit="edaff" :close="closebl"/>
    </q-dialog>

    <q-dialog v-model="edcom" persistent>
      <q-card class="petitelargeur">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="close"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NTcom', [t.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md style="height:50vh" :lgmax="250" editable :texte="t.info"
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
import { SetAttributTribu } from '../app/operations.mjs'
import { crypter } from '../app/webcrypto.mjs'
import BoutonHelp from './BoutonHelp.vue'
import EditeurMd from './EditeurMd.vue'
import NotifIco from './NotifIco.vue'
import EdBlocage from './EdBlocage.vue'
import BlocageIco from './BlocageIco.vue'
import { Blocage } from '../app/modele.mjs'

export default {
  name: 'ApercuTribu',

  props: { 
    id: Number, // id de la tribu
    idx: Number, edit: Boolean 
  },

  components: { ShowHtml, ApercuNotif, EditeurMd, BoutonHelp, EdBlocage, NotifIco, BlocageIco },

  computed: { },

  data () { return {
    edcom: false,
    edbl: false,
    edaff: false,
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
      await new SetAttributTribu().run(this.id, 'infok', buf)
      this.close()
    },
    close () { this.edcom = false},
    editerbl (ed) {
      this.bloc = this.t.blocage ? this.t.blocage.clone() : new Blocage(null, 0)
      this.edbl = true
      this.edaff = ed
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
