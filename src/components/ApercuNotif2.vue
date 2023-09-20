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
          <q-btn v-if="type < 3 && editable" color="primary" class="q-ml-sm btn2" size="sm" 
            :label="$t('editer')" dense icon="add" @click="editer"/>
        </div>
      </div>
      <div v-if="notif.nr">
          <span class="q-pa-xs bg-yellow-3 text-negative text-bold">
            {{$t('ANnr' + notif.nr)}}
          </span>
          <bouton-bulle :idtext="'nr' + notif.nr"/>
      </div>
      <show-html class="q-mt-xs bord" :texte="notif.texte" :idx="idx" 
        maxh="3rem" zoom scroll/>
    </div>
    <div v-if="type < 3 && (!notif || !notif.texte)" class="row">
      <div class="titre-md">{{$t('ANauc')}}</div>
      <q-btn v-if="editable" color="primary" class="q-ml-sm btn2" size="sm" 
        :label="$t('ANcre')" dense icon="add" @click="creer"/>
    </div>
  </div>

  <q-dialog v-model="editntf" persistent>
    <q-card class="bs moyennelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense color="warning" size="md" icon="close" @click="MD.fD"/>
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
      <q-card-actions>
        <q-btn dense flat color="primary" size="md" icon="close" :label="$t('renoncer')" 
          @click="MD.fD"/>
        <q-btn dense flat color="warning" size="md" icon="delete" :label="$t('supprimer')" 
          :disable="!notif || !notif.texte" @click="supprimer"/>
        <q-btn class="q-ml-md" dense flat color="warning" size="md" icon="check" 
          :label="$t('valider')" :disable="!ntf.texte" @click="valider"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</div>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import EditeurMd from './EditeurMd.vue'
import ShowHtml from './ShowHtml.vue'
import { MD, Notification, Qui } from '../app/modele.mjs'
import { dhcool, dkli, afficherDiag } from '../app/util.mjs'

export default {
  name: 'ApercuNotif2',

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
    idx: Number,
    ctx: Object // Objet de contexte retourné dans la notification créée / éditée
  },

  components: { BoutonHelp, BoutonBulle, EditeurMd, ShowHtml },

  watch: {
    restr (ap) { if (ap && this.restrb) this.restrb = false },
    restrb (ap) { if (ap && this.restr) this.restr = false }
  },

  computed: {
    nomSource () {
      if (this.type > 2) return ''
      if (this.type === 0) return this.$t('admin')
      if (!this.idsource) return this.$t('comptable')
      return Qui.de(idsource).nom
    }
  },

  data () { return {
    restr: false,
    restrb: false,
    ntf: null
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
      if (!await this.session.editpow(3)) return
      this.ntf = this.notif.clone()
      if (this.idsource) this.ntf.idSource = this.idsource
      if (this.session.pow === 3 && !this.ntf.idSource) {
        await afficherDiag($t('ANnospon'))
        return
      }
      if (this.type === 0) {
        if (this.ntf.nr === 1) { this.restr = true; this.restrb = false }
        if (this.ntf.nr === 2) { this.restr = false; this.restrb = true }
      } else {
        if (this.ntf.nr === 3) { this.restr = true; this.restrb = false }
        if (this.ntf.nr === 4) { this.restr = false; this.restrb = true }
      }
      this.oveditntf()
    },

    async creer () {
      if (!await this.quipeut()) return
      if (!await this.session.editpow(3)) return
      this.ntf = new Notification({})
      if (this.idsource) this.ntf.idSource = this.idsource
      this.restr = false
      this.restrb = false
      this.oveditntf()
    },

    async valider () {
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
      if (this.ctx) this.ntf.ctx = this.ctx
      this.$emit('ok', this.ntf)
      MD.fD()
    },

    supprimer () {
      const ntf = new Notification({})
      if (this.idsource) ntf.idSource = this.idsource
      if (this.ctx) ntf.ctx = this.ctx
      this.$emit('ok', ntf)
      MD.fD()
    }
  },
  setup (props) {
    const session = stores.session
    const n = toRef(props, 'notif')

    const editntf = ref(false)
    function oveditntf () { MD.oD(editntf) }

    return {
      MD, dhcool, dkli, editntf, oveditntf,
      session
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
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-item__section--avatar
  min-width: 0 !important
</style>
