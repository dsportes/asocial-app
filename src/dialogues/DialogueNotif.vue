<template>
<q-dialog v-model="ui.d.DNdialoguenotif" persistent>
  <q-card :class="styp('md')">
    <q-toolbar class="bg-secondary text-white">
      <q-btn dense color="warning" size="md" icon="close" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('ANnot')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-card-section class="q-my-sm q-mx-sm column">

      <div v-if="type===0">
        <q-checkbox size="sm" v-model="restr"/>
          <span>{{$t('ANnr1')}}<bouton-bulle idtext="nr1"/></span>
      </div>
      <div v-if="type===0">
        <q-checkbox size="sm" v-model="restrb"/>
          <span>{{$t('ANnr2')}}<bouton-bulle idtext="nr2"/></span>
      </div>

      <div v-if="type===1 || type===2">
        <q-checkbox size="sm" v-model="restr"/>
          <span>{{$t('ANnr3')}}<bouton-bulle idtext="nr3"/></span>
      </div>
      <div v-if="type===1 || type===2">
        <q-checkbox size="sm" v-model="restrb"/>
          <span>{{$t('ANnr4')}}<bouton-bulle idtext="nr4"/></span>
      </div>

    </q-card-section>
    <q-card-section class="q-my-sm q-mx-sm">
      <editeur-md mh="10rem" v-model="ntf.texte" :texte="ntf.texte" editable modetxt/>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="primary" size="md" padding="xs" dense icon="undo" 
        :label="$t('renoncer')" @click="ui.fD"/>
      <q-btn dense size="md" padding="xs" color="warning" icon="delete" 
        :label="$t('supprimer')" :disable="!ntf || !ntf.texte" @click="valider(true)"/>
      <q-btn class="q-ml-md" size="md" padding="xs" color="warning" icon="check" 
        :label="$t('valider')" :disable="!ntf.texte" @click="valider(false)"/>
    </q-card-actions>
  </q-card>
</q-dialog>
</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonBulle from '../components/BoutonBulle.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, dhcool, afficherDiag } from '../app/util.mjs'
import { SetNotifG, SetNotifT, SetNotifC } from '../app/operations.mjs'

export default {
  name: 'DialogueNotif',

  props: {  },

  components: { BoutonHelp, BoutonBulle, EditeurMd },

  watch: {
    restr (ap) { if (ap && this.restrb) this.restrb = false },
    restrb (ap) { if (ap && this.restr) this.restr = false }
  },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  data () { return {
  }},

  methods: {
    async valider (suppr) {
      if (!suppr) {
        this.ntf.nr = 0
        if (this.type === 0) {
          if (this.restr) this.ntf.nr = 1
          if (this.restrb) this.ntf.nr = 2
        } else {
          if (this.restr) this.ntf.nr = 3
          if (this.restrb) this.ntf.nr = 4
        }
        // Interdiction de se bloquer soi-même
        if (this.type === 1 && this.session.pow === 3 && this.ntf.nr) { 
          await afficherDiag(this.$t('ANer5'))
          return
        }
        if (this.type === 2 && (this.session.pow === 3 || this.session.pow === 2)
          && this.ntf.nr && this.ctx && this.ctx.id === this.session.compteId) {
            await afficherDiag(this.$t('ANer6'))
            return
        }
      }
      if (this.ntf.type === 0) {
        await new SetNotifG().run(ntf, this.ctx.ns)
      } else if (this.ntf.type === 1) {
        await new SetNotifT().run(suppr ? null : this.ntf, this.ctx.idt)
      } else {
        await new SetNotifC().run (suppr ? null : this.ntf, this.ctx.idt, this.ctx.idc)
      }
      this.ui.fD()
    }
  },
  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const ntf = ref(ui.notifc.ntf)
    const restr = ref(ui.notifc.restr)
    const restrb = ref(ui.notifc.restrb)
    const type = ref(ui.notifc.type)
    const ctx = ref(ui.notifc.ctx)

    return {
      styp, dhcool, ntf, restr, restrb, type, ctx,
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
