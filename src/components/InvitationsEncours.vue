<template>
<div>
  <div v-if="gSt.invits.size" class="petitelargeur maauto">
    <div class="titre-md text-italic bg-primary text-white q-mt-md text-center">{{$t('ICtit')}}</div>
    <div v-for="[k, inv] of gSt.invits" :key="k" 
      class="q-mx-md row invs" @click="ouvinv(inv)">
      <div class="col-6">{{inv.na.nom}}</div>
      <div class="col-6">{{inv.ng.nom}}</div>
    </div>
  </div>

  <!-- Acceptation de l'invitation -->
  <q-dialog v-model="invit" full-height persistent>
    <q-card class="bs" style="width:80vw">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('ICtit2', [inv.na.nom, inv.ng.nom])}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card-section>
        <apercu-genx :na="inv.ng" :cv="mb.ext.cvg"/>

        <div class="q-my-md titre-md text-italic bg-secondary text-white">{{$t('ICinvpar')}}</div>
        <div class="q-ma-sm" v-for="[im, x] in mb.ext.invs" :key="im">
          <apercu-genx :na="x.na" :cv="x.cv" people/>
          <q-separator color="orange"/>
        </div>

        <div class="q-my-md titre-md text-italic bg-secondary text-white">{{$t('ICflags', [edFlags])}}</div>
        <div class="titre-md text-italic">{{$t('ICcfl')}}</div>
        <q-checkbox v-if="fl & FLAGS.DM" v-model="iam" :label="$t('FLAGS3')" />
        <q-checkbox v-if="fl & FLAGS.DN" v-model="ian" :label="$t('FLAGS2')" />

        <div class="q-my-md titre-md text-italic bg-secondary text-white">{{$t('ICrem')}}</div>
        <editeur-md :lgmax="1000" v-model="ard" :texte="mb.ard || ''" modetxt mh="8rem"
          editable />
      </q-card-section>
              
      <div class="column justify-center items-center q-gutter-xs">
        <q-btn dense flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
        <div class="row justify-center q-gutter-sm">
        <q-btn dense :label="$t('ICacc')" color="primary" @click="ok(1)"/>
        <q-btn dense :label="$t('ICdec')" color="warning" @click="ok(2)"/>
        </div>
        <q-btn dense flat :label="$t('ICln')" color="warning" @click="cfln = true"/>
        <bouton-confirm v-if="cfln" :actif="cfln" :confirmer="ko"/>
      </div>

    </q-card>
  </q-dialog>
</div>
</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import { MD } from '../app/modele.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import { InvitationFiche, AcceptInvitation } from '../app/operations.mjs'
import ApercuGenx from './ApercuGenx.vue'
import { FLAGS } from '../app/api.mjs'

export default ({
  name: 'InvitationsEncours',

  components: { EditeurMd, BoutonHelp, ApercuGenx, BoutonConfirm },

  props: { },

  computed: {
    edFlags () { 
      if (!this.fl) return ''
      const ed = []
      if (this.fl & FLAGS.PA) ed.push(this.$t('AMinvpa'))
      if (this.fl & FLAGS.DM) ed.push(this.$t('AMinvdm'))
      if (this.fl & FLAGS.PE) ed.push(this.$t('AMinvpe'))
      else if (this.fl & FLAGS.DN) ed.push(this.$t('AMinvdn'))
      return ed.join(', ')
    },
  },

  data () { return {
    inv: null,
    mb: null,
    ln: false,
    iam: false,
    ian: false,
    aed: '',
    fl: 0,
    cfln: false
  }},

  methods: {
    async ouvinv (inv) {
      if (!await this.session.edit()) return
      this.inv = inv
      this.mb = await new InvitationFiche().run(inv.ng.id, inv.im)
      this.ard = this.mb.ard
      this.fl = this.mb.ext.flags
      if (this.fl & FLAGS.DM) this.iam = true
      if (this.fl & FLAGS.DN) this.ian = true
      this.ln = false
      this.cfln = false
      this.ovinvit()
    },

    async ko () { await this.ok(3) },

    async ok (cas) {
      MD.fD()
      await new AcceptInvitation().
        run(cas, this.mb.na, this.inv.ng, this.inv.im, this.ard, this.iam, this.ian)
    }
  },
  
  setup () {
    const session = stores.session
    const gSt = stores.groupe

    const invit = ref(false)
    function ovinvit () { MD.oD(invit) }
    return {
      session, gSt, FLAGS, MD, invit, ovinvit
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.invs:hover
  background-color: $secondary
  color: white
  cursor: pointer
</style>
