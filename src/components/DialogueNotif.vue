<template>
  <q-card :class="styp('md')">
    <q-toolbar class="bg-secondary text-white">
      <q-btn dense color="warning" size="md" icon="close" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('ANnot' + type)}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-card-section class="q-my-sm q-mx-sm column">

      <div>
        <q-checkbox size="sm" v-model="restrloc"/>
        <span>{{$t('ANnr' + type + '2')}}<bouton-bulle :idtext="'nr'+ type + '2'"/></span>
      </div>
      <div>
        <q-checkbox size="sm" v-model="restrbloc"/>
        <span>{{$t('ANnr' + type + '3')}}<bouton-bulle :idtext="'nr'+ type + '3'"/></span>
      </div>

    </q-card-section>
    <q-card-section class="q-my-sm q-mx-sm">
      <editeur-md mh="10rem" v-model="n.texte" :texte="ntf ? ntf.texte : ''" 
        editable modetxt/>
    </q-card-section>
    <q-card-actions align="right">
      <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
      <btn-cond color="warning" icon="delete" cond="cUrgence"
        :label="$t('supprimer')" :disable="!ntf.texte" @ok="valider(true)"/>
      <btn-cond class="q-ml-md" icon="check" cond="cUrgence"
        :label="$t('valider')" :disable="!n.texte" @click="valider(false)"/>
    </q-card-actions>
  </q-card>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import BtnCond from './BtnCond.vue'
import EditeurMd from './EditeurMd.vue'
import { styp, dhcool } from '../app/util.mjs'
import { SetNotifE, SetNotifP, SetNotifC } from '../app/operations4.mjs'
import { reconnexion, GetSynthese, GetPartition } from '../app/synchro.mjs'
import { RegCles } from '../app/modele.mjs'

export default {
  name: 'DialogueNotif',

  props: {  
    type: Number,
    /* Type des notifications:
    - 0 : de l'espace - cible: ns
    - 1 : d'une partition - cible: idPartition
    - 2 : d'un compte - cible: idCompte
    */
    ntf: Object,
    restr: Boolean,
    restrb: Boolean,
    cible: Number
  },

  components: { BtnCond, BoutonHelp, BoutonBulle, EditeurMd },

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
        this.n.nr = 1
        if (this.restrloc) this.n.nr = 2
        if (this.restrbloc) this.n.nr = 3
      } else {
        this.n.nr = 0
        this.texte = ''
      }
      if (this.type === 0) {
        await new SetNotifE().run(suppr ? null : this.n, this.cible)
        this.session.setOrg('admin')
        reconnexion()
      } else {
        if (this.type === 1) {
          const clep = RegCles.get(this.cible)
          const ntf = suppr ? null : await this.n.crypt(clep)
          await new SetNotifP().run(suppr ? null : ntf, this.cible)
        } else {
          const idp = this.session.partition.id
          const clep = RegCles.get(idp)
          const ntf = suppr ? null : await this.n.crypt(clep)
          await new SetNotifC().run (suppr ? null : ntf, this.cible)
          await new GetPartition().run(idp)
        }
        await new GetSynthese().run()
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
