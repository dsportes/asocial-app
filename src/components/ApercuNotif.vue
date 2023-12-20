<template>
<div>
  <div :class="dkli(idx)">
    <div v-if="notif && notif.texte" class="column q-my-sm">
      <div class="row justify-between">
        <div class="titre-md">{{$t('ANnot')}}</div>
        <div>
          <span v-if="nomSource" class="fs-sm text-italic q-mr-sm">
            {{$t('de')}} [{{nomSource}}]
          </span>
          <span class="fs-sm font-mono">{{dhcool(notif.dh)}}</span>
          <q-btn v-if="type < 3 && editable" color="primary" 
            class="q-ml-sm" size="md" padding="xs"
            :label="$t('editer')" dense icon="add" @click="editer"/>
        </div>
      </div>
      <div v-if="notif.nr">
          <span class="q-pa-xs bg-yellow-3 text-negative text-bold">
            {{$t('ANnr' + notif.nr)}}
          </span>
          <bouton-bulle :idtext="'nr' + notif.nr"/>
      </div>
      <show-html class="q-mt-xs bord" :texte="texteEd" :idx="idx" 
        maxh="3rem" zoom scroll/>
    </div>
    <div v-if="type < 3 && (!notif || !notif.texte)" class="row">
      <div class="titre-md">{{$t('ANauc')}}</div>
      <q-btn v-if="editable" class="q-ml-sm col-auto self-start" 
        color="primary" padding="xs" size="md" 
        :label="$t('ANcre')" dense icon="add" @click="creer"/>
    </div>
  </div>
</div>
</template>
<script>

import stores from '../stores/stores.mjs'
import BoutonBulle from './BoutonBulle.vue'
import ShowHtml from './ShowHtml.vue'
import { Notification, Qui } from '../app/modele.mjs'
import { dhcool, dkli, afficherDiag, $t } from '../app/util.mjs'

export default {
  name: 'ApercuNotif',

  props: { 
    notif: Object, // notification existante, null pour création éventuelle
    type: Number,
    /* Type des notifications:
    - 0 : de l'espace
    - 1 : d'une tribu
    - 2 : d'un compte
    - 3 : dépassement de quotas
    - 4 : alerte de solde / consommation
    */
    idsource: Number,
    editable: Boolean,
    ctx: Object, // id de l'espace, ou de la tranche, ou de la tranche et du compte ...
    idx: Number
  },

  components: { BoutonBulle, ShowHtml },

  watch: {
    restr (ap) { if (ap && this.restrb) this.restrb = false },
    restrb (ap) { if (ap && this.restr) this.restr = false }
  },

  computed: {
    texteEd () {
      if (this.notif.texte.startsWith('%')) {
        return this.$t('ANrntf' + this.notif.texte.substring(1, 2))
        return this.notif.texte
      } else return this.notif.texte
    },
    nomSource () {
      if (this.type > 2) return ''
      if (this.type === 0) return this.$t('admin')
      if (!this.idsource) return this.$t('comptable')
      return Qui.de(idsource).nom
    }
  },

  data () { return {
  }},

  methods: {
    async quipeut () {
      switch (this.type) {
        case 0 : {
          if (this.session.pow !== 1) { await afficherDiag($t('ANer1')); return false }
          else return true
        }
        case 1 : {
          if (this.session.pow !== 2 && this.session.pow !== 3) { await afficherDiag($t('ANer2')); return false }
          else return true
        }
        case 2 : {
          if (this.session.pow !== 2 && this.session.pow !== 3) { await afficherDiag($t('ANer3')); return false }
          else return true
        }
        case 3 :
        case 4 : {
          await afficherDiag($t('ANer4')); return false
        }
      }
    },
    async editer () {
      if (!await this.quipeut()) return
      if (this.type !== 0 && !await this.session.editpow(3)) return
      const ntf = this.notif.clone()
      if (this.idsource) ntf.idSource = this.idsource
      if (this.session.pow === 3 && !ntf.idSource) {
        await afficherDiag($t('ANnospon'))
        return
      }
      let restr, restrb
      if (this.type === 0) {
        if (ntf.nr === 1) { restr = true; restrb = false }
        if (ntf.nr === 2) { restr = false; restrb = true }
      } else {
        if (ntf.nr === 3) { restr = true; restrb = false }
        if (ntf.nr === 4) { restr = false; restrb = true }
      }
      this.ui.notifc = { type: this.type, ntf, restr, restrb, ctx: this.ctx }
      this.ui.oD('DNdialoguenotif')
    },

    async creer () {
      if (!await this.quipeut()) return
      if (this.type !== 0 && !await this.session.editpow(3)) return
      const ntf = new Notification({})
      if (this.idsource) ntf.idSource = this.idsource
      this.ui.notifc = { type: this.type, ntf, restr: false, restrb: false, ctx: this.ctx }
      this.ui.oD('DNdialoguenotif')
    }
  },
  setup (props) {
    const session = stores.session
    const ui = stores.ui
    // const n = toRef(props, 'notif')

    return {
      dhcool, dkli,
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
