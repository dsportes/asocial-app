<template>
  <q-card :class="styp('md')">
    <q-toolbar class="bg-secondary text-white">
      <q-btn dense color="warning" size="md" icon="close" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('ANnot')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-card-section class="q-my-sm q-mx-sm column">

      <div v-if="type===0">
        <q-checkbox size="sm" v-model="restrloc"/>
          <span>{{$t('ANnr1')}}<bouton-bulle idtext="nr1"/></span>
      </div>
      <div v-if="type===0">
        <q-checkbox size="sm" v-model="restrbloc"/>
          <span>{{$t('ANnr2')}}<bouton-bulle idtext="nr2"/></span>
      </div>

      <div v-if="type===1 || type===2">
        <q-checkbox size="sm" v-model="restrloc"/>
          <span>{{$t('ANnr3')}}<bouton-bulle idtext="nr3"/></span>
      </div>
      <div v-if="type===1 || type===2">
        <q-checkbox size="sm" v-model="restrbloc"/>
          <span>{{$t('ANnr4')}}<bouton-bulle idtext="nr4"/></span>
      </div>

    </q-card-section>
    <q-card-section class="q-my-sm q-mx-sm">
      <editeur-md mh="10rem" v-model="n.texte" :texte="ntf ? ntf.texte : ''" 
        editable modetxt/>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="primary" size="md" padding="xs" dense icon="undo" 
        :label="$t('renoncer')" @click="ui.fD"/>
      <q-btn dense size="md" padding="xs" color="warning" icon="delete" 
        :label="$t('supprimer')" :disable="!ntf.texte" @click="valider(true)"/>
      <q-btn class="q-ml-md" size="md" padding="xs" color="warning" icon="check" 
        :label="$t('valider')" :disable="!n.texte" @click="valider(false)"/>
    </q-card-actions>
  </q-card>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import EditeurMd from './EditeurMd.vue'
import { styp, dhcool, afficherDiag } from '../app/util.mjs'
import { SetNotifG, SetNotifT, SetNotifC } from '../app/operations.mjs'

export default {
  name: 'DialogueNotif',

  props: {  
    type: Number,
    /* Type des notifications:
    - 0 : de l'espace
    - 1 : d'une tribu
    - 2 : d'un compte
    - 3 : dépassement de quotas
    - 4 : alerte de solde / consommation
    */
    ntf: Object,
    restr: Boolean,
    restrb: Boolean,
    ns: Number,
    idt: Number,
    idc: Number
  },

  components: { BoutonHelp, BoutonBulle, EditeurMd },

  watch: {
    restrloc (ap) { if (ap && this.restrbloc) this.restrbloc = false },
    restrbloc (ap) { if (ap && this.restrloc) this.restrloc = false }
  },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  data () { return {
  }},

  methods: {
    async valider (suppr) {
      if (!suppr) {
        this.n.nr = 0
        if (this.type === 0) {
          if (this.restrloc) this.n.nr = 1
          if (this.restrbloc) this.n.nr = 2
        } else {
          if (this.restrloc) this.n.nr = 3
          if (this.restrbloc) this.n.nr = 4
        }
        // Interdiction de se bloquer soi-même
        if (this.type === 1 && this.session.pow === 3 && this.n.nr) { 
          await afficherDiag(this.$t('ANer10'))
          return
        }
        if (this.type === 2 && (this.session.pow === 3 || this.session.pow === 2)
          && this.n.nr && this.idc === this.session.compteId) {
            await afficherDiag(this.$t('ANer11'))
            return
        }
      }
      if (this.type === 0) {
        await new SetNotifG().run(suppr ? null : this.n, this.ns)
      } else if (this.type === 1) {
        await new SetNotifT().run(suppr ? null : this.n, this.idt)
      } else {
        await new SetNotifC().run (suppr ? null : this.n, this.idt, this.idc)
      }
      this.ui.fD()
    }
  },
  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const x = toRef(props, 'ntf')
    const n = ref(x.value.clone())
    const r1 = toRef(props, 'restr')
    const restrloc = ref(r1.value)
    const r2 = toRef(props, 'restrb')
    const restrbloc = ref(r2.value)

    return {
      styp, dhcool, n, restrloc, restrbloc,
      session, ui
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 2px
.btn2
  max-height: 1.5rem
.q-item__section--avatar
  min-width: 0 !important
</style>
