<template>
<q-card v-if="mb" class="bs" style="width:80vw">
  <q-toolbar class="bg-secondary text-white">
    <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
    <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('ICtit2', [mb.na.nom, mb.ng.nom])}}</q-toolbar-title>
    <bouton-help page="page1"/>
  </q-toolbar>
  <q-card-section>
    <apercu-genx :na="mb.ng" :cv="mb.ext.cvg"/>

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
      <q-btn dense :label="$t('ICdec')" color="warning" @click="cfln = true"/>
    </div>
    <div v-if="cfln" class="column justify-left">
      <span><q-radio v-model="decl" :val="2" :label="$t('ICd2')"/><bouton-bulle idtext="inv2"/></span>
      <span><q-radio v-model="decl" :val="3" :label="$t('ICd3')" /><bouton-bulle idtext="inv3"/></span>
      <span><q-radio v-model="decl" :val="4" :label="$t('ICd4')" /><bouton-bulle idtext="inv4"/></span>
      <bouton-confirm :actif="cfln" :confirmer="ko"/>
    </div>
  </div>

</q-card>
</template>
<script>

import { ref, toRef, onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import { MD } from '../app/modele.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonBulle from './BoutonBulle.vue'
import { InvitationFiche, AcceptInvitation } from '../app/operations.mjs'
import ApercuGenx from './ApercuGenx.vue'
import { FLAGS } from '../app/api.mjs'

export default ({
  name: 'InvitationAcceptation',

  components: { EditeurMd, BoutonHelp, ApercuGenx, BoutonConfirm, BoutonBulle },

  props: { idg: Number, im: Number },

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
  }},

  methods: {

    async ko () { await this.ok(this.decl) },

    async ok (cas) {
      MD.fD()
      const disp = await new AcceptInvitation(). // (cas, na, ng, im, ard, iam, ian)
        run(cas, this.mb.na, this.mb.ng, this.mb.ids, this.ard, this.iam, this.ian)
      if (disp) {
        await afficherDiag(this.$t('AMdisp'))
      }
    }
  },
  
  setup (props) {
    const session = stores.session
    const gSt = stores.groupe

    const idg = toRef(props, 'idg')
    const im = toRef(props, 'im')
    const mb = ref()
    const ard = ref()
    const fl = ref()
    const ln = ref(false)
    const cfln = ref(false)
    const decl = ref(2)
    const iam = ref(false)
    const ian = ref(false)

    onMounted(async () => {
      mb.value = await new InvitationFiche().run(idg.value, im.value)
      ard.value = mb.value.ard
      fl.value = mb.value.ext.flags
      if (fl.value & FLAGS.DM) iam.value = true
      if (fl.value & FLAGS.DN) ian.value = true
    })

    return {
      session, gSt, FLAGS, MD, mb, ard, fl, ln, cfln, decl, iam, ian
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
