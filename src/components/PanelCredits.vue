<template>
<div class="spmd q-pa-sm">

  <panel-deta v-if="!session.estComptable" :c="c" :total="aSt.compta.credits.total"
    class="q-ma-xs q-pa-xs bord1"/>

  <q-btn v-if="!session.estComptable" class="q-my-xs" dense color="primary" padding="xs"
    icon="add" :label="$t('TKnv')" @click="nvtk"/>

  <div v-if="!session.estComptable" class="q-ma-xs q-pa-xs bord1">
    <div class="text-italic titre-md">{{$t('TKinc')}}</div>
    <div v-if="dhinc" class="row titre-sm">
      <span class="q-mr-sm">{{$t('TKverif', [dhcool(dhinc)])}}</span>
      <span>{{$t('TKnbt', nbinc, { count: nbinc })}}</span>
    </div>
    <q-btn class="q-my-xs" flat size="sm" dense color="primary" padding="xs"
      icon="check" :label="$t('TKbtnv')" @click="rafraichirIncorp"/>
  </div>

  <q-separator color="orange" class="q-my-xs"/>

  <div class="row justify-center">
    <q-radio v-model="att" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" 
      val="A" :label="$t('TKatt')" class="q-mr-lg"/>
    <q-radio v-model="att" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" 
      val="T" :label="$t('tous')" />
  </div>

  <div v-if="session.estComptable" class="q-mt-sm row justify-center">
    <div class="row items-center">
      <span class="text-italic fs-md q-mr-md">{{$t('TKdeb')}}</span>
      <q-input class="lg2" dense v-model="deb" clearable counter maxlength="6">
        <template v-slot:hint>{{$t('TKdebh')}}</template>
      </q-input>
    </div>
  </div>

  <div class="titre-lg text-italic text-center q-mt-sm q-mb-md">
    {{$t('TK' + (session.estComptable ? '1' : '2') + att)}}
  </div>

  <div v-for="(tk, idx) in lstTk" :key="tk.ids">
    <apercu-ticket :tk="tk" :idx="idx"/>
  </div>

  <q-dialog v-model="ui.d.PCdialtk[idc]" persistent>
    <panel-dialtk :min="50" :init="0" titre="TKnv" @ok="generer"/>
  </q-dialog>

  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuTicket from '../components/ApercuTicket.vue'
import PanelDeta from '../components/PanelDeta.vue'
import PanelDialtk from '../components/PanelDialtk.vue'
import { dhcool, mon, dkli, genIdTk, styp, idTkToL6, afficherDiag } from '../app/util.mjs'
import { PlusTicket, RafraichirTickets } from '../app/operations.mjs'
import { AMJ } from '../app/api.mjs'

export default ({
  name: 'PanelCredits',

  props: { },

  components: { ApercuTicket, PanelDeta, PanelDialtk },

  computed: {
    c () { return this.session.estComptable ? null : this.aSt.compta.compteurs },

    lstTk () {
      function filtre (l, att, deb) {
        const r = []
        if (att === 'A' || deb !== '') { 
          const d = deb.toUpperCase()
          l.forEach(tk => { 
            const c1 = d ? idTkToL6(tk.ids).startsWith(d) : true
            const c2 = (att === 'A' && tk.dr === 0) || att !== 'A'
            if (c1 && c2) r.push(tk)
          })
          return r 
        }
        return l
      }

      const src = this.session.estComptable ? this.aSt.getTickets : this.aSt.compta.credits.tickets
      const l = filtre(src, this.att, this.deb)
      if (this.att === 'A') l.sort((a, b) => { return a.dg < b.dg ? -1 : (a.dg === b.dg ? 0 : 1) })
      else l.sort((a, b) => { return a.dg < b.dg ? -1 : (a.dg === b.dg ? 0 : -1) })
      return l
    }
  },

  data () {
    return {
    }
  },

  methods: {
    async nvtk () {
      if (!await this.session.editUrgence()) return
      this.mx = '0'
      this.ui.oD('PCdialtk', this.idc)
    },
    async generer ({m, ref}) {
      const [ax, mx, j] = AMJ.aaaammjj(AMJ.amjUtc())
      const ids = genIdTk(ax, mx)
      const tkx = idTkToL6(ids)
      this.ui.fD()
      await new PlusTicket().run(m, ref, ids)
      await afficherDiag(this.$t('TKrefp', [this.session.org, tkx]))
    }
  },

  setup () {
    const ui = stores.ui
    const session = stores.session
    const dhinc = ref(0)
    const nbinc = ref(0)

    async function rafraichirIncorp () {
      dhinc.value = Date.now()
      nbinc.value = await new RafraichirTickets().run()
    }

    onMounted(async () => {
      if (!session.estComptable) await rafraichirIncorp()
    })

    return {
      rafraichirIncorp, styp, mon, dhcool, dkli, AMJ,
      dhinc, nbinc,
      att: ref('A'), 
      deb: ref(''),
      aSt: stores.avatar,  
      session, ui, idc: ui.getIdc()
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.lg2
  width: 8rem
</style>
