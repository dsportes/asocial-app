<template>

<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated>
    <q-toolbar class="bg-secondary text-white">
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('ICtit2', [nomm, nomg])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container class="q-pa-xs">
    <q-expansion-item  :label="$t('ICti1')" class="q-my-xs q-mx-xs"
      header-class="bg-primary text-white titre-md"
      switch-toggle-side expand-separator dense group="trgroup">
      <apercu-genx :id="inv.idg" :idx="0"/>
      <q-separator class="q-my-xs" color="orange"/>
      <apercu-genx :id="inv.ida" :idx="1"/>
    </q-expansion-item>

    <q-expansion-item  :label="$t('ICti2')" class="q-my-xs q-mx-xs"
      header-class="bg-primary text-white titre-md"
      switch-toggle-side expand-separator dense group="trgroup">
      <div class="titre-lg">{{$t('AMinvvp')}}</div>
      <apercu-genx class="q-my-xs" v-for="(id, idx) in inv.invpar" :key="id" :id="id" :idx="idx"/>
    </q-expansion-item>

    <q-expansion-item  :label="$t('ICti3')" class="q-my-xs q-mx-xs"
      header-class="bg-primary text-white titre-md"
      switch-toggle-side expand-separator dense group="trgroup">
      <div class="q-my-md titre-lg text-bold">
        <span class="text-italic">{{$t('ICflags')}}</span>
        <span class="q-ml-md text-warning">{{edFlags}}</span>
      </div>

      <div class="titre-md q-mb-sm">{{$t('ICbienv')}}</div>
      <show-html class="bord1" :texte="inv.msg" maxh="4rem" scroll zoom/>

    </q-expansion-item>

    <q-card class="q-my-lg row justify-end items-center q-gutter-md">
      <btn-cond flat :label="$t('renoncer')" @ok="ui.fD"/>
      <btn-cond :label="$t('ICacc')" cond="cEdit" @ok="accref(1)"/>
      <btn-cond :label="$t('ICdec')" color="warning" cond="cEdit" @ok="accref(2)"/>
    </q-card>

    <div v-if="acc === 1">
      <q-separator class="q-my-md" color="orange"/>

      <div class="bord1 column q-my-xs">
        <q-checkbox v-model="iam" :label="$t('ICcflm')" />
        <q-checkbox v-model="ian" :label="$t('ICcfln')" />
      </div>

      <div class="q-mt-md q-mb-xs titre-md text-italic">{{$t('ICrem1')}}</div>
      <editeur-md :lgmax="1000" v-model="msg" :texte="defmsg" modetxt mh="8rem" editable />

      <div class="row justify-end items-center q-gutter-md">
        <btn-cond flat :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond class="q-ml-md" color="warning" :disable="!msg"
          :label="$t('confirmer')" @ok="ok(1)"/>
      </div>
    </div>

    <div v-if="acc === 2">
      <q-separator class="q-my-md" color="orange"/>
      <div class="bord1 column justify-left">
        <span><q-radio v-model="decl" dense :val="2" :label="$t('ICd2')"/><bouton-bulle idtext="inv2"/></span>
        <span><q-radio v-model="decl" dense :val="3" :label="$t('ICd3')" /><bouton-bulle idtext="inv3"/></span>
        <span><q-radio v-model="decl" dense :val="4" :label="$t('ICd4')" /><bouton-bulle idtext="inv4"/></span>
      </div>

      <div class="q-mt-md q-mb-xs titre-md text-italic">{{$t('ICrem2')}}</div>
      <editeur-md :lgmax="1000" v-model="msg" :texte="defmsg" modetxt mh="8rem" editable />

      <div class="row justify-end items-center q-gutter-md">
        <btn-cond flat :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond class="q-ml-md" color="warning" :disable="!decl || !msg"
          :label="$t('confirmer')" @ok="ok(decl)"/>
      </div>
    </div>
  </q-page-container>
</q-layout>
</template>
<script>

import stores from '../stores/stores.mjs'

import EditeurMd from './EditeurMd.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import ApercuGenx from './ApercuGenx.vue'
import BtnCond from './BtnCond.vue'
import ShowHtml from './ShowHtml.vue'

import { AcceptInvitation } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'
import { FLAGS } from '../app/api.mjs'

export default ({
  name: 'InvitationAcceptation',

  components: { BtnCond, ShowHtml, EditeurMd, BoutonHelp, ApercuGenx, BoutonBulle },

  props: { 
    inv: Object // { idg, ida, flags, invpar: Set(id invitant), msg }
  },

  computed: {
    nomm () { return this.session.getCV(this.inv.ida).nom },
    nomg () { return this.session.getCV(this.inv.idg).nom },
    fl () { return this.inv.flags },
    edFlags () { 
      const f = this.inv.flags
      if (!f) return ''
      const ed = []
      if (f & FLAGS.AN) ed.push(this.$t('AMinvan'))
      if (f & FLAGS.DM) ed.push(this.$t('AMinvdm'))
      if (f & FLAGS.DE) ed.push(this.$t('AMinvde'))
      else if (f & FLAGS.DN) ed.push(this.$t('AMinvdn'))
      return ed.join(', ')
    },
  },

  data () { return {
    msg: '',
    iam: true,
    ian: true,
    defmsg: this.$t('merci'),
    cfln: 0,
    decl: 0,
    acc: 0,
  }},

  methods: {
    accref (x) { this.acc = x },
    async ok (cas) {
      await new AcceptInvitation().run(cas, this.inv, this.iam, this.ian, this.msg)
      this.ui.fD()
    }
  },
  
  setup () {
    return {
      styp, FLAGS,
      session: stores.session,
      ui: stores.ui
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px
</style>
