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
        color="primary" padding="xs" size="sm" 
        :label="$t('ANcre')" dense icon="add" @click="creer"/>
    </div>
  </div>

  <q-dialog v-model="ui.d.DNdialoguenotif[idc]" persistent>
    <dialogue-notif :type="type" :ntf="ntf" :restr="restr" :restrb="restrb"
      :ns="ns" :idt="idt" :idc="idcpt"/>
  </q-dialog>
</div>
</template>
<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonBulle from './BoutonBulle.vue'
import ShowHtml from './ShowHtml.vue'
import DialogueNotif from './DialogueNotif.vue'
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

  components: { BoutonBulle, ShowHtml, DialogueNotif },

  watch: {
    restr (ap) { if (ap && this.restrb) this.restrb = false },
    restrb (ap) { if (ap && this.restr) this.restr = false }
  },

  computed: {
    texteEd () {
      if (this.notif.texte.startsWith('%')) {
        return this.$t('ANrntf' + this.notif.texte.substring(1, 2))
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
    restr: false,
    restrb: false,
    ntf: null
  }},

  methods: {
    async editer () {
      if (this.diag) { await afficherDiag($t('ANer' + this.diag)); return }
      this.ntf = this.notif.clone()
      if (this.idsource) ntf.idSource = this.idsource
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
      // this.ui.notifc = { type: this.type, ntf, restr, restrb, ns: this.ns, idt: this.idt, idc: this.idc }
      this.ui.oD('DNdialoguenotif', this.idc)
    },

    async creer () {
      if (this.diag) { await afficherDiag($t('ANer' + this.diag)); return }
      this.ntf = new Notification({})
      if (this.idsource) ntf.idSource = this.idsource
      // this.ui.notifc = { type: this.type, ntf, restr: false, restrb: false, ns: this.ns, idt: this.idt, idc: this.idc }
      this.ui.oD('DNdialoguenotif', this.idc)
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const type = toRef(props, 'type')
    const ctx = toRef(props, 'ctx')
    // const n = toRef(props, 'notif')
    const ns = ref(0)
    const idt = ref(0)
    const idcpt = ref(0)
    const editable = toRef(props, 'editable')

    function setDiag () {
      switch (type.value) {
        case 0 : {
          if (session.pow !== 1) return 1
          ns.value = ctx.value.ns
          break
        }
        case 1 : {
          if (session.pow !== 2 && session.pow !== 3) return 2
          idt.value = ctx.value.idt
          break
        }
        case 2 : {
          if (session.pow !== 2 && session.pow !== 3) return 3
          idt.value = ctx.value.idt
          idcpt.value = ctx.value.idc
          // un sponsor ne peut pas éditer la notif d'un autre sponsor
          if (pSt.estSponsor(idc.value)) return 5
          break
        }
        case 3 :
        case 4 : return 4 // on ne devrait jamais arriver là
      }
      return 0
    }

    const diag = ref(editable.value ? setDiag() : 0)

    return {
      dhcool, dkli, diag, ns, idt, idcpt,
      session, ui, idc
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
