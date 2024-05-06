<template>

<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated>
    <q-toolbar v-if="mb" class="bg-secondary text-white">
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('ICtit2', [nomm, nomg])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card-section>
      <apercu-genx :id="inv.idg"/>
      <q-separator class="q-my-sm" color="orange"/>
      <apercu-genx :id="inv.ida"/>
    </q-card-section>

    <q-card-section>
      <div class="titre-lg">{{$t('AMinvvp')}}</div>
      <apercu-genx class="q-my-xs" v-for="(id, idx) in inv.invpar" :key="id" :id="id" :idx="idx"/>
    </q-card-section>

    <q-card-section>
      <div class="titre-md q-mb-sm">{{$t('ICbienv')}}</div>
      <show-html :texte="inv.msg" maxh="4rem" scroll zoom/>

      <div class="q-my-md titre-md text-italic bg-secondary text-white">{{$t('ICflags', [edFlags])}}</div>
      <div class="titre-md text-italic">{{$t('ICcfl')}}</div>
      <q-checkbox v-if="fl & FLAGS.DM" v-model="iam" :label="$t('ICcflm')" />
      <q-checkbox v-if="fl & FLAGS.DN" v-model="ian" :label="$t('ICcfln')" />

      <div class="q-my-md titre-md text-italic bg-secondary text-white">{{$t('ICrem')}}</div>
      <editeur-md :lgmax="1000" v-model="msg" :texte="defmsg" modetxt mh="8rem" editable />
    </q-card-section>
            
    <div class="column justify-center items-center q-gutter-xs">
      <btn-cond flat :label="$t('renoncer')" @ok="ui.fD"/>
      <div class="row justify-center q-gutter-sm">
        <btn-cond :label="$t('ICacc')" cond="cEdit" @ok="ok(1)"/>
        <btn-cond :label="$t('ICdec')" color="warning" cond="cEdit" @ok="cfln = true"/>
      </div>
      <div v-if="cfln" class="column justify-left">
        <span><q-radio v-model="decl" :val="2" :label="$t('ICd2')"/><bouton-bulle idtext="inv2"/></span>
        <span><q-radio v-model="decl" :val="3" :label="$t('ICd3')" /><bouton-bulle idtext="inv3"/></span>
        <span><q-radio v-model="decl" :val="4" :label="$t('ICd4')" /><bouton-bulle idtext="inv4"/></span>
        <bouton-confirm :actif="cfln" :confirmer="ko"/>
      </div>
    </div>
  </q-page-container>
</q-layout>
</template>
<script>

import stores from '../stores/stores.mjs'

import EditeurMd from './EditeurMd.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonBulle from './BoutonBulle.vue'
import ApercuGenx from './ApercuGenx.vue'
import BtnCond from './BtnCond.vue'
import ShowHtml from './ShowHtml.vue'

import { AcceptInvitation } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'
import { FLAGS } from '../app/api.mjs'

export default ({
  name: 'InvitationAcceptation',

  components: { BtnCond, ShowHtml, EditeurMd, BoutonHelp, ApercuGenx, BoutonConfirm, BoutonBulle },

  props: { 
    inv: Object // { idg, ida, flags, invpar: Set(id invitant), msg }
  },

  computed: {
    nomm () { return this.session.getCV(this.inv.ida).nom },
    nomg () { return this.session.getCV(this.inv.idg).nom },
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
    decl: 0
  }},

  methods: {

    async ko () { await this.ok(this.decl) },

    async ok (cas) {
      await new AcceptInvitation().run(cas, inv, this.iam, this.ian, this.msg)
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
</style>
