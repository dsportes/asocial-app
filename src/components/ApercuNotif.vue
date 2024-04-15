<template>
<div>
  <div :class="dkli(idx)">
    <div v-if="notif && notif.texte" class="column q-my-sm">
      <div class="row justify-between">
        <div class="titre-md">{{$t('ANnot' + type)}}</div>
        <btn-cond v-if="type===0 && session.estAdmin" class="q-ml-sm" :label="$t('editer')" icon="edit"
          @ok="editer"/>
        <btn-cond v-if="type!==0 && session.pow < 4" class="q-ml-sm" :label="$t('editer')" icon="edit"
          cond="cUrgence"
          @ok="editer"/>
      </div>
      <div>
        <span class="fs-sm text-italic q-mr-sm">{{nomSource}}</span>
        <span class="fs-sm font-mono">{{dhcool(notif.dh)}}</span>
      </div>
      <div v-if="notif.nr > 1" class="q-mt-xs">
          <span class="q-pa-xs bg-yellow-3 text-negative text-bold">
            {{$t('ANnr' + type + notif.nr)}}
          </span>
          <bouton-bulle :idtext="'nr' + type + notif.nr"/>
      </div>
      <show-html class="q-mt-xs bord" :texte="notif.texte" :idx="idx" 
        maxh="3rem" zoom scroll/>
    </div>
    <div v-if="!diag && (!notif || !notif.texte)" class="row">
      <div class="titre-md">{{$t('ANauc' + type)}}</div>
      <btn-cond v-if="type===0 && session.estAdmin" class="q-ml-sm" :label="$t('ANcre')" icon="add"
        @ok="creer"/>
      <btn-cond v-if="type!==0 && session.pow < 4" class="q-ml-sm" :label="$t('ANcre')" icon="add"
        cond="cUrgence"
        @ok="creer"/>
    </div>
    <div v-if="diag" class="q-pa-xs bg-yellow-5 text-italic text-bold titre-md text-center">
      {{diag}}</div>
  </div>

  <q-dialog v-model="ui.d.DNdialoguenotif[idc]" persistent>
    <dialogue-notif :type="type" :cible="cible" :ntf="ntf" :restr="restr" :restrb="restrb"/>
  </q-dialog>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonBulle from './BoutonBulle.vue'
import BtnCond from './BtnCond.vue'
import ShowHtml from './ShowHtml.vue'
import DialogueNotif from './DialogueNotif.vue'
import { Notification } from '../app/modele.mjs'
import { dhcool, dkli, $t } from '../app/util.mjs'

export default {
  name: 'ApercuNotif',

  props: { 
    notif: Object, // notification existante, null pour création éventuelle
    type: Number,
    /* Type des notifications:
    - 0 : de l'espace
    - 1 : d'une partition
    - 2 : d'un compte
    */
    cible: Number, // type 0: ns, type 1: idPartition, type 2: idCompte
    idx: Number
  },

  components: { BtnCond, BoutonBulle, ShowHtml, DialogueNotif },

  watch: {
    restr (ap) { if (ap && this.restrb) this.restrb = false },
    restrb (ap) { if (ap && this.restr) this.restr = false }
  },

  computed: {
    nomSource () {
      if (this.type === 0) return this.$t('ANadmin')
      const del = this.notif.idDel
      if (!del) return this.$t('ANcomptable')
      const cv = this.session.getCV(del)
      return cv.tx ? $t('ANdel1', cv.nom) : $t('ANdel2')
    },
    diag () {
      if (this.session.estComptable || !this.notif || this.notif.idDel) return ''
      return this.$t('ANnotc') 
    }
  },

  data () { return {
    restr: false,
    restrb: false,
    ntf: null
  }},

  methods: {
    async editer () {
      this.ntf = this.notif.clone()
      if (this.ntf.nr === 2) { this.restr = true; this.restrb = false }
      if (this.ntf.nr === 3) { this.restr = false; this.restrb = true }
      this.ui.oD('DNdialoguenotif', this.idc)
    },

    async creer () {
      this.ntf = new Notification({})
      this.ui.oD('DNdialoguenotif', this.idc)
    }
  },

  setup (props) {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const cible = toRef(props, 'cible')
    const notif = toRef(props, 'notif')
    return {
      dhcool, dkli, 
      pSt: stores.people,
      session: stores.session,
      ui, idc
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
